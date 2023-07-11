import { ImageAnnotatorClient } from '@google-cloud/vision'
import { Configuration, OpenAIApi } from 'openai'
import {
  RekognitionClient,
  DetectLabelsCommand,
} from '@aws-sdk/client-rekognition'
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision'
import { ApiKeyCredentials } from '@azure/ms-rest-js'
import dataUriToBuffer from 'data-uri-to-buffer'

const googleCredentials = JSON.parse(process.env.GOOGLE_CREDS)

const rekognitionClient = new RekognitionClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const azureEndpoint = process.env.AZURE_ENDPOINT

const azureComputerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({
    inHeader: {
      'Ocp-Apim-Subscription-Key': process.env.AZURE_COMPUTER_VISION_KEY,
    },
  }),
  azureEndpoint
)

const visionClient = new ImageAnnotatorClient({
  credentials: googleCredentials,
})

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

// eslint-disable-next-line import/no-anonymous-default-export
export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const image = req.body.image
  const imageBufferForAzure = dataUriToBuffer(image)
  const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, '')

  const awsParms = {
    Image: {
      Bytes: Buffer.from(base64Image, 'base64'),
    },
    MaxLabels: 10,
  }

  try {
    // Retrieving data from AWS
    const awsPromise = async () => {
      const rekognitionData = await rekognitionClient.send(
        new DetectLabelsCommand(awsParms)
      )
      let awsPrompt = 'This image contains the following labels: '
      awsPrompt += `${rekognitionData.Labels.filter(
        (label) => label.Confidence > 80
      )
        .map((label) => label.Name)
        .join(', ')}. `

      const awsChatCompletion = await openai.createCompletion({
        model: 'text-davinci-003',
        n: 1,
        max_tokens: 150,
        prompt:
          awsPrompt +
          '\n\nGenerate a detailed and concise alt text for this image, let the text begin with `This image shows`: ',
        temperature: 0.3,
      })

      return {
        provider: 'Amazon Rekognition',
        generatedAltText: awsChatCompletion.data.choices[0].text,
        generatedPrompt: awsPrompt.trim(),
        response: rekognitionData,
      }
    }

    // Retrieving Data from Google
    const googlePromise = async () => {
      // Google
      const [result] = await visionClient.annotateImage({
        image: { content: base64Image },
        features: [
          { type: 'LABEL_DETECTION' },
          { type: 'LANDMARK_DETECTION' },
          { type: 'FACE_DETECTION' },
          { type: 'TEXT_DETECTION' },
          { type: 'OBJECT_LOCALIZATION' },
        ],
      })

      let googlePrompt = 'The image contains the following information: '
      if (result.labelAnnotations) {
        googlePrompt += `Labels: ${result.labelAnnotations
          .filter((label) => label.score > 0.8)
          .map((label) => label.description)
          .join(', ')}. `
      }
      if (result.landmarkAnnotations) {
        googlePrompt += `Landmarks: ${result.landmarkAnnotations
          .filter((label) => label.score > 0.8)
          .map((landmark) => landmark.description)
          .join(', ')}. `
      }
      if (result.faceAnnotations) {
        googlePrompt += `Faces: ${result.faceAnnotations
          .filter((label) => label.score > 0.8)
          .map((face) => face.description)
          .join(', ')}. `
      }
      if (result.textAnnotations) {
        googlePrompt += `Text: ${result.textAnnotations
          .filter((label) => label.score > 0.8)
          .map((text) => text.description)
          .join(', ')}. `
      }
      if (result.localizedObjectAnnotations) {
        googlePrompt += `Objects: ${result.localizedObjectAnnotations
          .filter((label) => label.score > 0.8)
          .map((object) => object.description)
          .join(', ')}. `
      }

      const googleChatCompletion = await openai.createCompletion({
        model: 'text-davinci-003',
        n: 3,
        max_tokens: 150,
        prompt:
          googlePrompt +
          '\n\nGenerate a detailed and concise alt text for this image, let the text begin with `This image shows`: ',
        temperature: 0.3,
      })

      return {
        provider: 'Google CV',
        generatedAltText: googleChatCompletion.data.choices[0].text,
        generatedPrompt: googlePrompt.trim(),
        response: result,
      }
    }

    // Retrieving Data from Azure
    const azurePromise = async () => {
      const azureVisualFeatures = [
        'Categories',
        'Description',
        'Color',
        'Tags',
        'Faces',
        'Brands',
        'Objects',
      ]
      const azureResult = await azureComputerVisionClient.analyzeImageInStream(
        imageBufferForAzure,
        { visualFeatures: azureVisualFeatures }
      )

      let azurePrompt = 'The image contains the following information: '

      if (azureResult.categories) {
        azurePrompt += `Categories: ${azureResult.categories
          .map((category) => category.name)
          .join(', ')}. `
      }

      if (azureResult.description) {
        if (azureResult.description.captions) {
          azurePrompt += `Description: ${azureResult.description.captions[0].text}. `
        }
        if (azureResult.description.tags) {
          azurePrompt += `Tags: ${azureResult.description.tags.join(', ')}. `
        }
      }

      if (azureResult.color) {
        azurePrompt += `Dominant Color: ${azureResult.color.dominantColorForeground}. `
      }

      const azureChatCompletion = await openai.createCompletion({
        model: 'text-davinci-003',
        n: 3,
        max_tokens: 150,
        prompt:
          azurePrompt +
          '\n\nGenerate a detailed and concise alt text for this image, let the text begin with `This image shows`: ',
        temperature: 0.3,
      })

      return {
        provider: 'Azure Computer Vision',
        generatedAltText: azureChatCompletion.data.choices[0].text,
        generatedPrompt: azurePrompt.trim(),
        response: azureResult,
      }
    }

    const generatedAltTexts = await Promise.all([
      awsPromise(),
      googlePromise(),
      azurePromise(),
    ])

    res.status(200).json(generatedAltTexts)
  } catch (error) {
    console.error('Error completing request', error)
    res.status(500).json({ error: error.message })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
}
