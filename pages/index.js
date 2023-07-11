import React, { useState } from 'react'
import imageCompression from 'browser-image-compression'
import LoadingSpinner from '../components/LoadingSpinner'

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
    const response = await fetch('/api/analyzeImg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
    })

    const data = await response.json()
    console.log('data: ', data)
    setAltText(data)
    setIsLoading(false)
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
                    <div style={{fontWeight: 'bold'}}>{data.provider}</div>
                    <p>
                    {data.generatedAltText.trim()}
                    </p>
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
