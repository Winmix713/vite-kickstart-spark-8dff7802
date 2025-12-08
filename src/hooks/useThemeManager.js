import { useState, useEffect } from 'react'

export const defaultThemes = {
    'emerald-dark': {
        id: 'emerald-dark',
        name: 'Emerald Dark',
        description: 'Premium dark theme with emerald accents',
        colors: {
            primary: '#10b981',
            secondary: '#f97316',
            accent: '#10b981',
            background: '#0f172a',
            foreground: '#f1f5f9',
            muted: '#64748b',
            border: '#334155'
        },
        typography: {
            fontFamily: 'Inter',
            fontSize: {
                xs: 12,
                sm: 14,
                base: 16,
                lg: 18,
                xl: 20
            }
        }
    },
    'azure-dark': {
        id: 'azure-dark',
        name: 'Azure Dark',
        description: 'Dark theme with blue-azure accents',
        colors: {
            primary: '#3b82f6',
            secondary: '#8b5cf6',
            accent: '#3b82f6',
            background: '#0f172a',
            foreground: '#f1f5f9',
            muted: '#64748b',
            border: '#334155'
        },
        typography: {
            fontFamily: 'Inter',
            fontSize: {
                xs: 12,
                sm: 14,
                base: 16,
                lg: 18,
                xl: 20
            }
        }
    },
    'violet-dark': {
        id: 'violet-dark',
        name: 'Violet Dark',
        description: 'Dark theme with purple-violet accents',
        colors: {
            primary: '#8b5cf6',
            secondary: '#f97316',
            accent: '#8b5cf6',
            background: '#0f172a',
            foreground: '#f1f5f9',
            muted: '#64748b',
            border: '#334155'
        },
        typography: {
            fontFamily: 'Inter',
            fontSize: {
                xs: 12,
                sm: 14,
                base: 16,
                lg: 18,
                xl: 20
            }
        }
    }
}

const STORAGE_KEY = 'winmixpro-theme'

export function useThemeManager() {
    const [theme, setTheme] = useState(defaultThemes['emerald-dark'])

    // Load theme from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsedTheme = JSON.parse(stored)
                setTheme(parsedTheme)
            }
        } catch (error) {
            console.error('Error loading theme from localStorage:', error)
            setTheme(defaultThemes['emerald-dark'])
        }
    }, [])

    // Save theme to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
        } catch (error) {
            console.error('Error saving theme to localStorage:', error)
        }
    }, [theme])

    const updateTheme = (updates) => {
        setTheme(prev => ({ ...prev, ...updates }))
    }

    const updateColors = (colorUpdates) => {
        setTheme(prev => ({
            ...prev,
            colors: { ...prev.colors, ...colorUpdates }
        }))
    }

    const updateTypography = (typographyUpdates) => {
        setTheme(prev => ({
            ...prev,
            typography: { ...prev.typography, ...typographyUpdates }
        }))
    }

    const saveTheme = () => {
        // Theme is automatically saved via useEffect
        console.log('Theme saved successfully')
    }

    const resetToDefault = () => {
        setTheme(defaultThemes['emerald-dark'])
    }

    const applyPreset = (presetId) => {
        const preset = defaultThemes[presetId]
        if (preset) {
            setTheme(preset)
        }
    }

    const exportAsJSON = () => {
        return JSON.stringify(theme, null, 2)
    }

    const importFromJSON = (jsonString) => {
        try {
            const importedTheme = JSON.parse(jsonString)
            
            // Validate structure
            if (!importedTheme.id || !importedTheme.name || !importedTheme.colors || !importedTheme.typography) {
                throw new Error('Invalid theme format: missing required fields')
            }

            // Validate colors
            const requiredColors = ['primary', 'secondary', 'accent', 'background', 'foreground', 'muted', 'border']
            for (const colorKey of requiredColors) {
                if (typeof importedTheme.colors[colorKey] !== 'string' || !importedTheme.colors[colorKey].startsWith('#')) {
                    throw new Error(`Invalid color format for ${colorKey}: must be hex color`)
                }
            }

            // Validate typography
            if (typeof importedTheme.typography.fontFamily !== 'string') {
                throw new Error('Invalid typography: fontFamily must be string')
            }
            if (!importedTheme.typography.fontSize || 
                typeof importedTheme.typography.fontSize.xs !== 'number' ||
                typeof importedTheme.typography.fontSize.sm !== 'number' ||
                typeof importedTheme.typography.fontSize.base !== 'number' ||
                typeof importedTheme.typography.fontSize.lg !== 'number' ||
                typeof importedTheme.typography.fontSize.xl !== 'number') {
                throw new Error('Invalid typography: fontSize values must be numbers')
            }

            setTheme(importedTheme)
            return true
        } catch (error) {
            console.error('Error importing theme:', error)
            throw error
        }
    }

    return {
        theme,
        themes: defaultThemes,
        updateTheme,
        updateColors,
        updateTypography,
        saveTheme,
        resetToDefault,
        applyPreset,
        exportAsJSON,
        importFromJSON
    }
}