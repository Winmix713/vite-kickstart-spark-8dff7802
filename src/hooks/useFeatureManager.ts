// Converting to JS to avoid TypeScript issues in JS project
export default {}

const STORAGE_KEY = 'winmixpro-features'

const defaultFeatures: Feature[] = [
  {
    id: 'admin-system',
    name: 'Admin System',
    description: 'Enable the WinMixPro admin dashboard',
    enabled: true,
    rollout: 100,
    category: 'System'
  },
  {
    id: 'real-time-updates',
    name: 'Real-time Updates',
    description: 'Enable live match updates and notifications',
    enabled: true,
    rollout: 100,
    category: 'Data'
  },
  {
    id: 'authentication',
    name: 'Authentication',
    description: 'User authentication and authorization system',
    enabled: true,
    rollout: 100,
    category: 'Security'
  },
  {
    id: 'match-predictions',
    name: 'Match Predictions',
    description: 'AI-powered match prediction algorithms',
    enabled: false,
    rollout: 0,
    category: 'AI'
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Advanced analytics and reporting features',
    enabled: false,
    rollout: 0,
    category: 'Analytics'
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    description: 'Native mobile application features',
    enabled: false,
    rollout: 0,
    category: 'Mobile'
  },
  {
    id: 'live-streaming',
    name: 'Live Streaming',
    description: 'Live match streaming capabilities',
    enabled: false,
    rollout: 0,
    category: 'Media'
  },
  {
    id: 'social-features',
    name: 'Social Features',
    description: 'Social media integration and sharing',
    enabled: false,
    rollout: 0,
    category: 'Social'
  },
  {
    id: 'fantasy-league',
    name: 'Fantasy League',
    description: 'Fantasy football league management',
    enabled: false,
    rollout: 0,
    category: 'Gaming'
  },
  {
    id: 'api-access',
    name: 'API Access',
    description: 'Third-party API integrations',
    enabled: false,
    rollout: 0,
    category: 'Integration'
  }
]

export function useFeatureManager() {
  const [features, setFeatures] = useState<Feature[]>([])

  // Load features from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedFeatures = JSON.parse(stored)
        setFeatures(parsedFeatures)
      } else {
        // Initialize with default features
        setFeatures(defaultFeatures)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFeatures))
      }
    } catch (error) {
      console.error('Error loading features from localStorage:', error)
      setFeatures(defaultFeatures)
    }
  }, [])

  // Save features to localStorage whenever they change
  useEffect(() => {
    if (features.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(features))
      } catch (error) {
        console.error('Error saving features to localStorage:', error)
      }
    }
  }, [features])

  const updateFeature = (id: string, updates: Partial<Feature>) => {
    setFeatures(prev => 
      prev.map(feature => 
        feature.id === id ? { ...feature, ...updates } : feature
      )
    )
  }

  const toggleFeature = (id: string) => {
    updateFeature(id, { 
      enabled: !features.find(f => f.id === id)?.enabled 
    })
  }

  const setRollout = (id: string, rollout: number) => {
    updateFeature(id, { rollout: Math.max(0, Math.min(100, rollout)) })
  }

  const deleteFeature = (id: string) => {
    setFeatures(prev => prev.filter(feature => feature.id !== id))
  }

  const addFeature = (feature: Feature) => {
    setFeatures(prev => [...prev, { ...feature, id: feature.id || Date.now().toString() }])
  }

  const enableAll = () => {
    setFeatures(prev => prev.map(feature => ({ ...feature, enabled: true, rollout: 100 })))
  }

  const disableAll = () => {
    setFeatures(prev => prev.map(feature => ({ ...feature, enabled: false, rollout: 0 })))
  }

  const exportAsJSON = () => {
    return JSON.stringify(features, null, 2)
  }

  const importFromJSON = (jsonString: string) => {
    try {
      const importedFeatures = JSON.parse(jsonString)
      
      // Validate structure
      if (!Array.isArray(importedFeatures)) {
        throw new Error('Invalid format: expected an array')
      }

      // Validate each feature
      importedFeatures.forEach((feature, index) => {
        if (!feature.id || !feature.name || !feature.description) {
          throw new Error(`Invalid feature at index ${index}: missing required fields`)
        }
        if (typeof feature.enabled !== 'boolean') {
          throw new Error(`Invalid feature at index ${index}: enabled must be boolean`)
        }
        if (typeof feature.rollout !== 'number' || feature.rollout < 0 || feature.rollout > 100) {
          throw new Error(`Invalid feature at index ${index}: rollout must be number between 0-100`)
        }
      })

      setFeatures(importedFeatures)
      return true
    } catch (error) {
      console.error('Error importing features:', error)
      throw error
    }
  }

  return {
    features,
    updateFeature,
    toggleFeature,
    setRollout,
    deleteFeature,
    addFeature,
    enableAll,
    disableAll,
    exportAsJSON,
    importFromJSON
  }
}