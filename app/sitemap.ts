import type { MetadataRoute } from 'next'

const BASE_URL = 'https://owo-mi-five.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/en`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          'en-CA': `${BASE_URL}/en`,
          'fr-CA': `${BASE_URL}/fr`,
        },
      },
    },
    {
      url: `${BASE_URL}/fr`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          'en-CA': `${BASE_URL}/en`,
          'fr-CA': `${BASE_URL}/fr`,
        },
      },
    },
  ]
}
