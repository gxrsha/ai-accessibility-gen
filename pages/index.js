import React, { useState } from 'react'
import imageCompression from 'browser-image-compression'
import LoadingSpinner from '../components/LoadingSpinner'
import JsonView from '@uiw/react-json-view'
import { darkTheme } from '@uiw/react-json-view/dark'

export default function Home() {
  const [imageSrc, setImageSrc] = useState(null)
  const [altText, setAltText] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleImageUpload = async (event) => {
    setIsLoading(true)
    const file = event.target.files[0]

    if (file) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      }

      try {
        const compressedFile = await imageCompression(file, options)

        const reader = new FileReader()
        reader.readAsDataURL(compressedFile)
        reader.onloadend = () => {
          const base64data = reader.result
          setImageSrc(base64data)
          analyzeImage(base64data)
        }
      } catch (error) {
        console.error('Error compressing image:', error)
      }
    }
  }

  const analyzeImage = async (image) => {
    try {
      const response = await fetch('/api/analyzeImg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
  
      const data = await response.json()
      console.log('data: ', data)
      setAltText(data)
      setIsLoading(false)

    } catch (err) {
      console.log('There was an error processing request: ', err)

    }
  }

  return (
    <>
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h3>Alt Text Generator</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 'calc(100vh / 2 * 16/9)', // Calculate width based on height
              height: 'calc(100vh / 2)', // Third of
              margin: '0 2rem',
              border: '2px solid gray',
            }}
          >
            {imageSrc && (
              <img
                src={imageSrc}
                alt={altText}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )}
          </div>
          <div>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            {/* <button onClick={handleAltTextGeneration}>Generate Alt Text</button> */}
          </div>
        </div>
        <div style={{ width: '100%', textAlign: 'center' }}>
          {altText && !isLoading && (
            <>
              <h3>Generated Text</h3>
              <div
                style={{
                  marginTop: '1rem',
                  marginLeft: '2rem',
                  marginRight: '2rem',
                  textAlign: 'start',
                }}
              >
                {altText.map((data, index) => (
                  <div style={{ marginTop: '1rem' }} key={index}>
                    <div style={{ fontWeight: 'bold' }}>{data.provider}</div>
                    <p>{data.generatedAltText.trim()}</p>
                    <pre
                      style={{
                        backgroundColor: '#222',
                        color: '#ccc',
                        border: '1px solid #ddd',
                        padding: '20px',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      <code>
                        &lt;img src=&quot;YOUR_IMAGE_SRC&quot; alt=&quot;
                        {data.generatedAltText.trim()}&quot; /&gt;
                      </code>
                    </pre>
                    <div>
                      <JsonView
                        value={data.response}
                        collapsed={1}
                        style={customTheme}
                        keyName={`${data.provider} response`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {isLoading && <LoadingSpinner />}
        </div>
      </div>
    </>
  )
}

// Styles for the json object
const customTheme = {
  '--w-rjv-font-family': 'monospace',
  '--w-rjv-color': '#9cdcfe',
  '--w-rjv-background-color': '#1e1e1e',
  '--w-rjv-line-color': '#323232',
  '--w-rjv-arrow-color': 'var(--w-rjv-color)',
  '--w-rjv-edit-color': 'var(--w-rjv-color)',
  '--w-rjv-add-color': 'var(--w-rjv-color)',
  '--w-rjv-info-color': '#656565',
  '--w-rjv-update-color': '#ebcb8b',
  '--w-rjv-copied-color': '#9cdcfe',
  '--w-rjv-copied-success-color': '#28a745',

  '--w-rjv-curlybraces-color': '#d4d4d4',
  '--w-rjv-brackets-color': '#d4d4d4',

  '--w-rjv-type-string-color': '#ce9178',
  '--w-rjv-type-int-color': '#268bd2',
  '--w-rjv-type-float-color': '#859900',
  '--w-rjv-type-bigint-color': '#268bd2',
  '--w-rjv-type-boolean-color': '#559bd4',
  '--w-rjv-type-date-color': '#586e75',
  '--w-rjv-type-url-color': '#649bd8',
  '--w-rjv-type-null-color': '#d33682',
  '--w-rjv-type-nan-color': '#859900',
  '--w-rjv-type-undefined-color': '#586e75',
}
