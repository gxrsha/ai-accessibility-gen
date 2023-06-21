import { ImageAnnotatorClient } from '@google-cloud/vision'
import { Configuration, OpenAIApi } from 'openai'

const googleCredentials = JSON.parse(process.env.GOOGLE_CREDS)

const visionClient = new ImageAnnotatorClient({
  credentials: googleCredentials,
})

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const image = req.body.image
  const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, '')

  try {
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

    let prompt = 'The image contains the following information: '
    if (result.labelAnnotations) {
      prompt += `Labels: ${result.labelAnnotations
        .map((label) => label.description)
        .join(', ')}. `
    }
    if (result.landmarkAnnotations) {
      prompt += `Landmarks: ${result.landmarkAnnotations
        .map((landmark) => landmark.description)
        .join(', ')}. `
    }
    if (result.faceAnnotations) {
      prompt += `Faces: ${result.faceAnnotations
        .map((face) => face.description)
        .join(', ')}. `
    }
    if (result.textAnnotations) {
      prompt += `Text: ${result.textAnnotations
        .map((text) => text.description)
        .join(', ')}. `
    }
    if (result.localizedObjectAnnotations) {
      prompt += `Objects: ${result.localizedObjectAnnotations
        .map((object) => object.description)
        .join(', ')}. `
    }

    const chatCompletion = await openai.createCompletion({
      model: 'text-davinci-003',
      n: 3,
      max_tokens: 150,
      prompt:
        prompt +
        '\n\nGenerate a detailed and concise alt text for this image, let the text begin with `This image shows`: ',
    })

    res.status(200).json({ choices: chatCompletion.data.choices })
  } catch (error) {
    console.error('Error calling Vision API', error.message)
    res.status(500).json({ error: 'Error calling Vision API' })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
}
