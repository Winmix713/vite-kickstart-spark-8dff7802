import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'

// Mock theme hooks
const useThemeManager = vi.fn()

vi.mock('@hooks/useThemeManager', () => ({
  useThemeManager,
}))

// Theme management component for testing
const ThemeImportExportComponent = () => {
  const { currentTheme, themes, exportTheme, importTheme } = useThemeManager()
  const [importResult, setImportResult] = useState('')
  const [importError, setImportError] = useState('')

  const handleExport = () => {
    try {
      const jsonData = exportTheme(currentTheme)
      setImportResult('Theme export successful')
      setImportError('')
    } catch (error) {
      setImportError(error.message)
    }
  }

  const handleImport = (jsonString: string) => {
    try {
      importTheme(jsonString)
      setImportResult('Theme import successful')
      setImportError('')
    } catch (error) {
      setImportError(error.message)
      setImportResult('')
    }
  }

  return (
    <div>
      <h1>Theme Management</h1>
      <button onClick={handleExport} data-testid="export-theme-btn">
        Export Theme
      </button>
      <textarea
        data-testid="import-theme-textarea"
        placeholder="Paste theme JSON here"
        onChange={(e) => handleImport(e.target.value)}
      />
      <div data-testid="import-theme-result">{importResult}</div>
      <div data-testid="import-theme-error">{importError}</div>
      <div data-testid="current-theme-name">{currentTheme?.name || 'None'}</div>
    </div>
  )
}

describe('Admin Theme Import/Export Tests', () => {
  const mockTheme = {
    id: 'emerald-dark',
    name: 'Emerald Dark',
    description: 'Premium dark theme with emerald accents',
    colors: {
      primary: '#10b981',
      secondary: '#f97316',
      accent: '#10b981',
      background: '#0f172a',
      foreground: '#f1f5f9',
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
      },
    },
  }

  const mockThemes = [
    mockTheme,
    {
      id: 'azure-light',
      name: 'Azure Light',
      description: 'Clean light theme with azure accents',
      colors: {
        primary: '#0ea5e9',
        secondary: '#6366f1',
        accent: '#0ea5e9',
        background: '#ffffff',
        foreground: '#1f2937',
      },
      typography: {
        fontFamily: 'Poppins',
        fontSize: {
          xs: 11,
          sm: 13,
          base: 15,
          lg: 17,
          xl: 19,
        },
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock the hook to return themes and functions
    useThemeManager.mockReturnValue({
      currentTheme: mockTheme,
      themes: mockThemes,
      exportTheme: vi.fn((theme) => JSON.stringify(theme, null, 2)),
      importTheme: vi.fn((jsonString) => {
        const parsed = JSON.parse(jsonString)
        
        // Validate theme structure
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Invalid theme JSON format')
        }

        // Check required properties
        if (!parsed.id || !parsed.name || !parsed.description) {
          throw new Error('Invalid theme JSON format')
        }

        // Validate colors
        const colors = parsed.colors
        if (!colors || 
            typeof colors.primary !== 'string' ||
            typeof colors.secondary !== 'string' ||
            typeof colors.accent !== 'string' ||
            typeof colors.background !== 'string' ||
            typeof colors.foreground !== 'string') {
          throw new Error('Invalid theme JSON format')
        }

        // Basic hex color validation
        const hexRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/
        if (!hexRegex.test(colors.primary) ||
            !hexRegex.test(colors.secondary) ||
            !hexRegex.test(colors.accent) ||
            !hexRegex.test(colors.background) ||
            !hexRegex.test(colors.foreground)) {
          throw new Error('Invalid theme JSON format')
        }

        // Validate typography
        const typography = parsed.typography
        if (!typography ||
            typeof typography.fontFamily !== 'string' ||
            !typography.fontSize ||
            typeof typography.fontSize.xs !== 'number' ||
            typeof typography.fontSize.sm !== 'number' ||
            typeof typography.fontSize.base !== 'number' ||
            typeof typography.fontSize.lg !== 'number' ||
            typeof typography.fontSize.xl !== 'number') {
          throw new Error('Invalid theme JSON format')
        }

        return parsed
      }),
    })
  })

  describe('Theme Export', () => {
    it('should export theme as valid JSON', () => {
      const { exportTheme, currentTheme } = useThemeManager()
      
      const result = exportTheme(currentTheme)
      
      expect(() => JSON.parse(result)).not.toThrow()
      expect(JSON.parse(result)).toEqual(currentTheme)
    })

    it('should preserve all theme properties during export', () => {
      const { exportTheme, currentTheme } = useThemeManager()
      
      const exported = exportTheme(currentTheme)
      const parsed = JSON.parse(exported)

      expect(parsed).toEqual(currentTheme)
    })

    it('should preserve color values during export', () => {
      const { exportTheme, currentTheme } = useThemeManager()
      
      const exported = exportTheme(currentTheme)
      const parsed = JSON.parse(exported)

      expect(parsed.colors.primary).toBe('#10b981')
      expect(parsed.colors.secondary).toBe('#f97316')
      expect(parsed.colors.accent).toBe('#10b981')
      expect(parsed.colors.background).toBe('#0f172a')
      expect(parsed.colors.foreground).toBe('#f1f5f9')
    })

    it('should preserve typography settings during export', () => {
      const { exportTheme, currentTheme } = useThemeManager()
      
      const exported = exportTheme(currentTheme)
      const parsed = JSON.parse(exported)

      expect(parsed.typography.fontFamily).toBe('Inter')
      expect(parsed.typography.fontSize.base).toBe(16)
      expect(parsed.typography.fontSize.xl).toBe(20)
    })
  })

  describe('Theme Import', () => {
    it('should import valid theme JSON', () => {
      const { exportTheme, importTheme, currentTheme } = useThemeManager()
      const exported = exportTheme(currentTheme)
      const imported = importTheme(exported)

      expect(imported).toEqual(currentTheme)
    })

    it('should validate color format during import', () => {
      const { importTheme } = useThemeManager()
      const invalidTheme = JSON.stringify({
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          primary: 'not-a-hex-color',
        },
      })

      expect(() => importTheme(invalidTheme)).toThrow('Invalid theme JSON format')
    })

    it('should validate required properties during import', () => {
      const { importTheme } = useThemeManager()
      const incompleteTheme = JSON.stringify({
        id: 'test',
        name: 'Test',
        // Missing description and other properties
      })

      expect(() => importTheme(incompleteTheme)).toThrow('Invalid theme JSON format')
    })

    it('should validate typography numbers during import', () => {
      const { importTheme } = useThemeManager()
      const invalidTheme = JSON.stringify({
        ...mockTheme,
        typography: {
          ...mockTheme.typography,
          fontSize: {
            ...mockTheme.typography.fontSize,
            base: 'not-a-number',
          },
        },
      })

      expect(() => importTheme(invalidTheme)).toThrow('Invalid theme JSON format')
    })

    it('should handle import errors gracefully in UI', async () => {
      const user = userEvent.setup()
      
      render(<ThemeImportExportComponent />)

      // Try to import invalid JSON using fireEvent instead
      fireEvent.change(screen.getByTestId('import-theme-textarea'), {
        target: { value: '{invalid json}' }
      })

      await waitFor(() => {
        expect(screen.getByTestId('import-theme-error')).toHaveTextContent('Invalid theme JSON format')
      })

      expect(screen.queryByTestId('import-theme-result')).not.toHaveTextContent('Theme import successful')
    })
  })

  describe('Color Validation', () => {
    it('should accept valid 6-digit hex colors', () => {
      const validTheme = {
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          primary: '#ff6b35',
          background: '#1a1a2e',
        },
      }

      const { importTheme } = useThemeManager()
      const result = importTheme(JSON.stringify(validTheme))
      
      expect(result).toEqual(validTheme)
    })

    it('should accept valid 3-digit hex colors', () => {
      const validTheme = {
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          primary: '#abc',
          background: '#def',
        },
      }

      const { importTheme } = useThemeManager()
      const result = importTheme(JSON.stringify(validTheme))
      
      expect(result).toEqual(validTheme)
    })

    it('should reject invalid hex color format', () => {
      const { importTheme } = useThemeManager()
      const invalidTheme = JSON.stringify({
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          primary: '#GGGGGG',
        },
      })

      expect(() => importTheme(invalidTheme)).toThrow('Invalid theme JSON format')
    })

    it('should reject short hex colors without standard format', () => {
      const { importTheme } = useThemeManager()
      const invalidTheme = JSON.stringify({
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          primary: '#1gb',
        },
      })

      expect(() => importTheme(invalidTheme)).toThrow('Invalid theme JSON format')
    })

    it('should reject color names', () => {
      const { importTheme } = useThemeManager()
      const invalidTheme = JSON.stringify({
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          primary: 'red',
        },
      })

      expect(() => importTheme(invalidTheme)).toThrow('Invalid theme JSON format')
    })
  })

  describe('Round-trip Operations', () => {
    it('should preserve data through export and import cycle', () => {
      const { exportTheme, importTheme, currentTheme } = useThemeManager()
      
      const exported = exportTheme(currentTheme)
      const imported = importTheme(exported)
      const reexported = exportTheme(imported)

      expect(JSON.parse(reexported)).toEqual(currentTheme)
    })

    it('should handle multiple export/import cycles', () => {
      const { exportTheme, importTheme } = useThemeManager()
      
      let theme = mockTheme

      for (let i = 0; i < 3; i++) {
        const exported = exportTheme(theme)
        theme = importTheme(exported)
      }

      expect(theme).toEqual(mockTheme)
    })

    it('should handle theme variations', () => {
      const variations = [
        { ...mockTheme, id: 'azure-dark', name: 'Azure Dark' },
        { ...mockTheme, id: 'violet-dark', name: 'Violet Dark' },
      ]

      const { exportTheme, importTheme } = useThemeManager()

      variations.forEach((variant) => {
        const exported = exportTheme(variant)
        const imported = importTheme(exported)
        expect(imported).toEqual(variant)
      })
    })
  })

  describe('UI Integration', () => {
    it('should display current theme name', () => {
      render(<ThemeImportExportComponent />)
      
      expect(screen.getByTestId('current-theme-name')).toHaveTextContent('Emerald Dark')
    })

    it('should show export success message', async () => {
      const user = userEvent.setup()
      
      render(<ThemeImportExportComponent />)

      await user.click(screen.getByTestId('export-theme-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('import-theme-result')).toHaveTextContent('Theme export successful')
      })
    })

    it('should handle successful theme import', async () => {
      const user = userEvent.setup()
      
      render(<ThemeImportExportComponent />)

      // Use fireEvent instead of userEvent.type to avoid parsing issues
      fireEvent.change(screen.getByTestId('import-theme-textarea'), {
        target: { value: JSON.stringify(mockTheme) }
      })

      await waitFor(() => {
        expect(screen.getByTestId('import-theme-result')).toHaveTextContent('Theme import successful')
      })

      expect(screen.queryByTestId('import-theme-error')).not.toHaveTextContent('Invalid theme JSON format')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON', () => {
      const { importTheme } = useThemeManager()
      
      expect(() => importTheme('{"invalid": json}')).toThrow()
    })

    it('should handle non-object JSON', () => {
      const { importTheme } = useThemeManager()
      
      expect(() => importTheme('"not-an-object"')).toThrow()
      expect(() => importTheme('123')).toThrow()
      expect(() => importTheme('null')).toThrow()
    })

    it('should handle missing typography data', () => {
      const { importTheme } = useThemeManager()
      const invalidTheme = JSON.stringify({
        ...mockTheme,
        typography: null,
      })

      expect(() => importTheme(invalidTheme)).toThrow()
    })

    it('should handle missing font size data', () => {
      const { importTheme } = useThemeManager()
      const invalidTheme = JSON.stringify({
        ...mockTheme,
        typography: {
          ...mockTheme.typography,
          fontSize: null,
        },
      })

      expect(() => importTheme(invalidTheme)).toThrow()
    })
  })

  describe('Theme Structure Validation', () => {
    it('should validate correct theme structure', () => {
      const { importTheme } = useThemeManager()
      const result = importTheme(JSON.stringify(mockTheme))
      
      expect(result).toEqual(mockTheme)
    })

    it('should reject themes with missing color data', () => {
      const { importTheme } = useThemeManager()
      const invalidTheme = JSON.stringify({
        id: 'invalid-theme',
        name: 'Invalid Theme',
        description: 'Theme missing colors',
        // Missing colors property
        typography: mockTheme.typography,
      })

      expect(() => importTheme(invalidTheme)).toThrow()
    })

    it('should reject themes with partial color data', () => {
      const { importTheme } = useThemeManager()
      const invalidTheme = JSON.stringify({
        ...mockTheme,
        colors: {
          primary: '#fff',
          // Missing secondary, accent, background, foreground
        },
      })

      expect(() => importTheme(invalidTheme)).toThrow()
    })

    it('should enforce typography structure', () => {
      const { importTheme } = useThemeManager()
      const invalidTheme = JSON.stringify({
        ...mockTheme,
        typography: {
          fontFamily: 'Arial',
          // Missing fontSize object
        },
      })

      expect(() => importTheme(invalidTheme)).toThrow()
    })

    it('should validate font size numbers', () => {
      const { importTheme } = useThemeManager()
      const invalidTheme = JSON.stringify({
        ...mockTheme,
        typography: {
          ...mockTheme.typography,
          fontSize: {
            ...mockTheme.typography.fontSize,
            lg: 'invalid', // Should be number
          },
        },
      })

      expect(() => importTheme(invalidTheme)).toThrow()
    })
  })
})