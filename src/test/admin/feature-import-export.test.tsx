import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'

// Mock feature hooks
const useFeatureManager = vi.fn()

vi.mock('@hooks/useFeatureManager', () => ({
  useFeatureManager,
}))

// Feature management component for testing
const FeatureImportExportComponent = () => {
  const { features, exportFeatures, importFeatures } = useFeatureManager()
  const [importResult, setImportResult] = useState('')
  const [importError, setImportError] = useState('')

  const handleExport = () => {
    try {
      const jsonData = exportFeatures()
      setImportResult('Export successful')
      setImportError('')
    } catch (error) {
      setImportError(error.message)
    }
  }

  const handleImport = (jsonString: string) => {
    try {
      importFeatures(jsonString)
      setImportResult('Import successful')
      setImportError('')
    } catch (error) {
      setImportError(error.message)
      setImportResult('')
    }
  }

  return (
    <div>
      <h1>Feature Management</h1>
      <button onClick={handleExport} data-testid="export-btn">
        Export Features
      </button>
      <textarea
        data-testid="import-textarea"
        placeholder="Paste feature JSON here"
        onChange={(e) => handleImport(e.target.value)}
      />
      <div data-testid="import-result">{importResult}</div>
      <div data-testid="import-error">{importError}</div>
      <div data-testid="features-count">{features.length}</div>
    </div>
  )
}

describe('Admin Feature Import/Export Tests', () => {
  const mockFeatures = [
    {
      id: 'feature-1',
      name: 'Dark Mode',
      description: 'Enable dark theme for the application',
      enabled: true,
      rollout: 100,
      category: 'UI',
    },
    {
      id: 'feature-2',
      name: 'Live Chat',
      description: 'Real-time chat functionality',
      enabled: false,
      rollout: 0,
      category: 'Social',
    },
    {
      id: 'feature-3',
      name: 'Advanced Analytics',
      description: 'Detailed match statistics and insights',
      enabled: true,
      rollout: 75,
      category: 'Analytics',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock the hook to return features and functions
    useFeatureManager.mockReturnValue({
      features: mockFeatures,
      exportFeatures: vi.fn(() => JSON.stringify(mockFeatures, null, 2)),
      importFeatures: vi.fn((jsonString) => {
        const parsed = JSON.parse(jsonString)
        if (!Array.isArray(parsed)) {
          throw new Error('Invalid feature JSON format')
        }
        if (!parsed.every(item => 
          item.id && 
          item.name && 
          item.description && 
          typeof item.enabled === 'boolean' && 
          typeof item.rollout === 'number' &&
          item.rollout >= 0 &&
          item.rollout <= 100 &&
          item.category
        )) {
          throw new Error('Invalid feature JSON format')
        }
        return parsed
      }),
    })
  })

  describe('Feature Export', () => {
    it('should export features as valid JSON', () => {
      const { exportFeatures } = useFeatureManager()
      
      const result = exportFeatures()
      
      expect(() => JSON.parse(result)).not.toThrow()
      expect(JSON.parse(result)).toEqual(mockFeatures)
    })

    it('should preserve all feature properties during export', () => {
      const { exportFeatures } = useFeatureManager()
      
      const exported = exportFeatures()
      const parsed = JSON.parse(exported)

      expect(parsed).toHaveLength(mockFeatures.length)
      mockFeatures.forEach((original, index) => {
        expect(parsed[index]).toEqual(original)
      })
    })

    it('should handle empty features array export', () => {
      useFeatureManager.mockReturnValue({
        features: [],
        exportFeatures: vi.fn(() => JSON.stringify([], null, 2)),
        importFeatures: vi.fn(),
      })

      const { exportFeatures } = useFeatureManager()
      const result = exportFeatures()
      
      expect(JSON.parse(result)).toEqual([])
    })

    it('should preserve rollout values during export', () => {
      const { exportFeatures } = useFeatureManager()
      
      const exported = exportFeatures()
      const parsed = JSON.parse(exported)

      const featureWith75Rollout = parsed.find(f => f.rollout === 75)
      expect(featureWith75Rollout?.rollout).toBe(75)
    })
  })

  describe('Feature Import', () => {
    it('should import valid feature JSON', () => {
      const { exportFeatures, importFeatures } = useFeatureManager()
      const exported = exportFeatures()
      const imported = importFeatures(exported)

      expect(imported).toEqual(mockFeatures)
    })

    it('should validate JSON structure during import', () => {
      const { importFeatures } = useFeatureManager()
      const invalidJson = JSON.stringify([{ id: 'test', invalid: true }])

      expect(() => importFeatures(invalidJson)).toThrow('Invalid feature JSON format')
    })

    it('should validate rollout range during import', () => {
      const { importFeatures } = useFeatureManager()
      const invalidFeature = JSON.stringify([
        {
          id: 'test',
          name: 'Test',
          description: 'Test',
          enabled: true,
          rollout: 150, // Invalid: > 100
          category: 'Test',
        },
      ])

      expect(() => importFeatures(invalidFeature)).toThrow()
    })

    it('should reject non-array JSON during import', () => {
      const { importFeatures } = useFeatureManager()
      const invalidJson = JSON.stringify({ id: 'test' })

      expect(() => importFeatures(invalidJson)).toThrow()
    })

    it('should handle import errors gracefully in UI', async () => {
      const user = userEvent.setup()
      
      render(<FeatureImportExportComponent />)

      // Try to import invalid JSON using fireEvent instead
      fireEvent.change(screen.getByTestId('import-textarea'), {
        target: { value: '{invalid json}' }
      })

      await waitFor(() => {
        expect(screen.getByTestId('import-error')).toHaveTextContent('Invalid feature JSON format')
      })

      expect(screen.queryByTestId('import-result')).not.toHaveTextContent('Import successful')
    })
  })

  describe('Round-trip Operations', () => {
    it('should preserve data through export and import cycle', () => {
      const { exportFeatures, importFeatures } = useFeatureManager()
      
      const exported = exportFeatures()
      const imported = importFeatures(exported)
      const reexported = exportFeatures()

      expect(JSON.parse(reexported)).toEqual(mockFeatures)
    })

    it('should handle multiple export/import cycles', () => {
      const { exportFeatures, importFeatures } = useFeatureManager()
      
      let data = mockFeatures

      for (let i = 0; i < 3; i++) {
        const exported = exportFeatures()
        data = importFeatures(exported)
      }

      expect(data).toEqual(mockFeatures)
    })
  })

  describe('UI Integration', () => {
    it('should display current feature count', () => {
      render(<FeatureImportExportComponent />)
      
      expect(screen.getByTestId('features-count')).toHaveTextContent('3')
    })

    it('should show export success message', async () => {
      const user = userEvent.setup()
      
      render(<FeatureImportExportComponent />)

      await user.click(screen.getByTestId('export-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('import-result')).toHaveTextContent('Export successful')
      })
    })

    it('should update feature count after import', async () => {
      const user = userEvent.setup()
      
      useFeatureManager.mockReturnValue({
        features: mockFeatures,
        exportFeatures: vi.fn(),
        importFeatures: vi.fn(() => {
          // Simulate adding a feature
          return [...mockFeatures, {
            id: 'feature-4',
            name: 'New Feature',
            description: 'New feature description',
            enabled: false,
            rollout: 0,
            category: 'New',
          }]
        }),
      })

      render(<FeatureImportExportComponent />)

      expect(screen.getByTestId('features-count')).toHaveTextContent('3')

      // Use fireEvent instead of userEvent.type to avoid parsing issues
      fireEvent.change(screen.getByTestId('import-textarea'), {
        target: { value: JSON.stringify(mockFeatures) }
      })

      await waitFor(() => {
        expect(screen.getByTestId('features-count')).toHaveTextContent('4')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle import validation errors', () => {
      const { importFeatures } = useFeatureManager()
      
      // Test missing properties
      const invalidFeature = JSON.stringify([{
        id: 'test',
        name: 'Test',
        // Missing other required properties
      }])

      expect(() => importFeatures(invalidFeature)).toThrow()
    })

    it('should handle invalid rollout values', () => {
      const { importFeatures } = useFeatureManager()
      
      const invalidFeature = JSON.stringify([{
        id: 'test',
        name: 'Test',
        description: 'Test',
        enabled: 'yes', // Should be boolean
        rollout: 100,
        category: 'Test',
      }])

      expect(() => importFeatures(invalidFeature)).toThrow()
    })

    it('should handle malformed JSON', () => {
      const { importFeatures } = useFeatureManager()
      
      expect(() => importFeatures('{"invalid": json}')).toThrow()
    })
  })

  describe('Feature Data Validation', () => {
    it('should validate correct feature structure', () => {
      const validFeatures = [
        {
          id: 'valid-feature',
          name: 'Valid Feature',
          description: 'This is valid',
          enabled: true,
          rollout: 100,
          category: 'Valid',
        },
      ]

      const { importFeatures } = useFeatureManager()
      const result = importFeatures(JSON.stringify(validFeatures))
      
      expect(result).toEqual(validFeatures)
    })

    it('should reject features with missing required fields', () => {
      const invalidFeatures = [
        {
          id: 'invalid-feature',
          name: 'Invalid Feature',
          // Missing description
          enabled: true,
          rollout: 100,
          category: 'Invalid',
        },
      ]

      const { importFeatures } = useFeatureManager()
      
      expect(() => importFeatures(JSON.stringify(invalidFeatures))).toThrow()
    })

    it('should enforce rollout percentage limits', () => {
      const invalidFeatures = [
        {
          id: 'invalid-feature',
          name: 'Invalid Feature',
          description: 'Invalid rollout',
          enabled: true,
          rollout: 101, // Over 100%
          category: 'Invalid',
        },
      ]

      const { importFeatures } = useFeatureManager()
      
      expect(() => importFeatures(JSON.stringify(invalidFeatures))).toThrow()
    })
  })
})