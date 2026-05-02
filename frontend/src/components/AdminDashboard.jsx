import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import './AdminDashboard.css'

function AdminDashboard() {
  const [feedbackList, setFeedbackList] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [message, setMessage] = useState(null)

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/feedback', {
        params: {
          sort_by: 'created_at',
          sort_order: 'desc'
        }
      })
      setFeedbackList(response.data)
    } catch (error) {
      console.error('获取反馈列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    setStatsLoading(true)
    try {
      const response = await api.get('/api/statistics')
      setStatistics(response.data)
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback()
    fetchStatistics()
  }, [])

  const handleDelete = async (id) => {
    setDeleteConfirm(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    
    try {
      await api.delete(`/api/feedback/${deleteConfirm}`)
      
      setMessage({
        type: 'success',
        text: '反馈已成功删除'
      })
      
      fetchFeedback()
      fetchStatistics()
      
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || '删除失败'
      })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/api/export/excel', {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      const contentDisposition = response.headers['content-disposition']
      let filename = 'feedback.xlsx'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setMessage({
        type: 'success',
        text: 'Excel导出成功'
      })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: '导出失败，请稍后重试'
      })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderStars = (rating) => {
    return (
      <div className="stars-mini">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star-mini ${star <= rating ? 'active' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">📊 管理后台</h1>
        <button onClick={handleExportExcel} className="export-btn">
          📥 导出Excel
        </button>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 反馈列表
        </button>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📈 数据统计
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="tab-content">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>加载中...</p>
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p className="empty-text">暂无反馈数据</p>
            </div>
          ) : (
            <div className="feedback-table-container">
              <table className="feedback-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>昵称</th>
                    <th>就餐日期</th>
                    <th>菜品评分</th>
                    <th>服务评分</th>
                    <th>评价内容</th>
                    <th>提交时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackList.map((feedback) => (
                    <tr key={feedback.id} className="table-row">
                      <td className="cell-id">{feedback.id}</td>
                      <td className="cell-nickname">{feedback.nickname}</td>
                      <td className="cell-date">{feedback.visit_date}</td>
                      <td className="cell-rating">
                        {renderStars(feedback.food_rating)}
                        <span className="rating-text">{feedback.food_rating}分</span>
                      </td>
                      <td className="cell-rating">
                        {renderStars(feedback.service_rating)}
                        <span className="rating-text">{feedback.service_rating}分</span>
                      </td>
                      <td className="cell-comment">
                        {feedback.comment || <span className="no-comment">-</span>}
                      </td>
                      <td className="cell-time">{formatDate(feedback.created_at)}</td>
                      <td className="cell-action">
                        {deleteConfirm === feedback.id ? (
                          <div className="action-confirm">
                            <button
                              onClick={confirmDelete}
                              className="btn-confirm-delete"
                            >
                              确认
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="btn-cancel"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDelete(feedback.id)}
                            className="btn-delete"
                          >
                            🗑️ 删除
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="tab-content">
          {statsLoading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>加载统计数据中...</p>
            </div>
          ) : statistics ? (
            <div className="stats-container">
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-card-icon">📊</div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">{statistics.total_count}</div>
                    <div className="stat-card-label">总反馈数</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-icon">🍽️</div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">{statistics.avg_food_rating}</div>
                    <div className="stat-card-label">菜品平均分</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-icon">👨‍🍳</div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">{statistics.avg_service_rating}</div>
                    <div className="stat-card-label">服务平均分</div>
                  </div>
                </div>
              </div>

              <div className="stats-details">
                <div className="stat-section">
                  <h3 className="stat-section-title">🍽️ 菜品评分分布</h3>
                  <div className="rating-bars">
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = statistics.food_rating_distribution[rating] || 0
                      const percentage = statistics.total_count > 0 
                        ? (count / statistics.total_count) * 100 
                        : 0
                      return (
                        <div key={rating} className="rating-bar-row">
                          <span className="rating-label">{rating}星</span>
                          <div className="rating-bar-wrapper">
                            <div 
                              className="rating-bar food"
                              style={{ width: `${percentage}%` }}
                            ></div>
                            <span className="rating-count">{count}条 ({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="stat-section">
                  <h3 className="stat-section-title">👨‍🍳 服务评分分布</h3>
                  <div className="rating-bars">
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = statistics.service_rating_distribution[rating] || 0
                      const percentage = statistics.total_count > 0 
                        ? (count / statistics.total_count) * 100 
                        : 0
                      return (
                        <div key={rating} className="rating-bar-row">
                          <span className="rating-label">{rating}星</span>
                          <div className="rating-bar-wrapper">
                            <div 
                              className="rating-bar service"
                              style={{ width: `${percentage}%` }}
                            ></div>
                            <span className="rating-count">{count}条 ({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📊</span>
              <p className="empty-text">暂无统计数据</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
