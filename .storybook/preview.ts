import type { Preview } from '@storybook/react'
import '../src/styles.css'

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0d0f15' },
        { name: 'light', value: '#f7f9fa' },
      ],
    },
  },
}

export default preview