import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClothingService } from '../lib/clothingService'
import { useTranslation } from 'react-i18next'

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, byType: {}, byColor: {} })
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const wardrobeStats = await ClothingService.getStats()
      setStats(wardrobeStats)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('dashboard:welcomeTitle')}
        </h1>
        <p className="text-gray-600">{t('dashboard:welcomeSubtitle')}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/add-item" className="card hover:shadow-md transition-shadow">
          <div className="text-center">
            <div className="text-4xl mb-3">📸</div>
            <h2 className="text-xl font-semibold mb-2">{t('dashboard:addItemTitle')}</h2>
            <p className="text-gray-600">{t('dashboard:addItemText')}</p>
          </div>
        </Link>

        <Link to="/wardrobe" className="card hover:shadow-md transition-shadow">
          <div className="text-center">
            <div className="text-4xl mb-3">👗</div>
            <h2 className="text-xl font-semibold mb-2">{t('dashboard:wardrobeTitle')}</h2>
            <p className="text-gray-600">{t('dashboard:wardrobeText')}</p>
          </div>
        </Link>

        <Link to="/suggestions" className="card hover:shadow-md transition-shadow">
          <div className="text-center">
            <div className="text-4xl mb-3">✨</div>
            <h2 className="text-xl font-semibold mb-2">{t('dashboard:suggestTitle')}</h2>
            <p className="text-gray-600">{t('dashboard:suggestText')}</p>
          </div>
        </Link>

        <Link to="/history" className="card hover:shadow-md transition-shadow">
          <div className="text-center">
            <div className="text-4xl mb-3">📅</div>
            <h2 className="text-xl font-semibold mb-2">{t('dashboard:historyTitle')}</h2>
            <p className="text-gray-600">{t('dashboard:historyText')}</p>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-3">{t('dashboard:statsTitle')}</h3>
        {loading ? (
            <div className="text-center py-4">
            <div className="text-gray-600">{t('dashboard:loadingStats')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-500">{stats.total}</div>
              <div className="text-sm text-gray-600">{t('dashboard:items')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-500">
                {Object.keys(stats.byType).length}
              </div>
              <div className="text-sm text-gray-600">{t('dashboard:categories')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-500">
                {Object.keys(stats.byColor).length}
              </div>
              <div className="text-sm text-gray-600">{t('dashboard:colors')}</div>
            </div>
          </div>
        )}
        
        {stats.total > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">{t('dashboard:byCategory')}</h4>
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className="capitalize">{type}s:</span>
                    <span className="font-medium">{String(count)}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">{t('dashboard:byColor')}</h4>
                {Object.entries(stats.byColor).slice(0, 4).map(([color, count]) => (
                  <div key={color} className="flex justify-between">
                    <span className="capitalize">{color}:</span>
                    <span className="font-medium">{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;