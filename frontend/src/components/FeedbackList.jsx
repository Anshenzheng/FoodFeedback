import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './FeedbackList.css'

function FeedbackList() {
  const [feedbackList, setFeedbackList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    food_rating: '',
    service_rating: '',
    date_from: '',
    date_to: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      const params = {}
      
      if (filters.food_rating) params.food_rating = filters.food_rating
      if (filters.service_rating) params.service_rating = filters.service_rating
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      params.sort_by = filters.sort_by
      params.sort_order = filters.sort_order

      const response = await axios.get('/api/feedback', { params })
      setFeedbackList(response.data)
    } catch (error) {
      console.error('获取反馈列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback()
  }, [filters])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      food_rating: '',
      service_rating: '',
      date_from: '',
      date_to: '',
      sort_by: 'created_at',
      sort_order: 'desc'
    })
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
      <div className="stars-small">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star-small ${star <= rating ? 'active' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="feedback-list-container">
      <div className="list-header">
        <h2 className="list-title">📋 顾客反馈列表</h2>
        <p className="list-subtitle">共 {feedbackList.length} 条反馈</p>
      </div>

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label className="filter-label">菜品评分</label>
            <select
              name="food_rating"
              value={filters.food_rating}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">全部</option>
              <option value="5">5星</option>
              <option value="4">4星</option>
              <option value="3">3星</option>
              <option value="2">2星</option>
              <option value="1">1星</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">服务评分</label>
            <select
              name="service_rating"
              value={filters.service_rating}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">全部</option>
              <option value="5">5星</option>
              <option value="4">4星</option>
              <option value="3">3星</option>
              <option value="2">2星</option>
              <option value="1">1星</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">就餐日期从</label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">至</label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>
        </div>

        <div className="sort-row">
          <div className="sort-group">
            <label className="sort-label">排序方式</label>
            <select
              name="sort_by"
              value={filters.sort_by}
              onChange={handleFilterChange}
              className="sort-select"
            >
              <option value="created_at">提交时间</option>
              <option value="visit_date">就餐日期</option>
              <option value="food_rating">菜品评分</option>
              <option value="service_rating">服务评分</option>
            </select>
            <select
              name="sort_order"
              value={filters.sort_order}
              onChange={handleFilterChange}
              className="sort-select"
            >
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>

          <button onClick={clearFilters} className="clear-btn">
            重置筛选
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      ) : feedbackList.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p className="empty-text">暂无反馈数据</p>
          <p className="empty-hint">请尝试调整筛选条件</p>
        </div>
      ) : (
        <div className="feedback-cards">
          {feedbackList.map((feedback) => (
            <div key={feedback.id} className="feedback-card">
              <div className="card-header">
                <div className="user-info">
                  <span className="user-avatar">
                    {feedback.nickname.charAt(0).toUpperCase()}
                  </span>
                  <div className="user-details">
                    <span className="nickname">{feedback.nickname}</span>
                    <span className="visit-date">就餐: {feedback.visit_date}</span>
                  </div>
                </div>
                <div className="submit-time">
                  {formatDate(feedback.created_at)}
                </div>
              </div>

              <div className="card-ratings">
                <div className="rating-item">
                  <span className="rating-label">🍽️ 菜品</span>
                  {renderStars(feedback.food_rating)}
                  <span className="rating-score">{feedback.food_rating}分</span>
                </div>
                <div className="rating-item">
                  <span className="rating-label">👨‍🍳 服务</span>
                  {renderStars(feedback.service_rating)}
                  <span className="rating-score">{feedback.service_rating}分</span>
                </div>
              </div>

              {feedback.comment && (
                <div className="card-comment">
                  <p className="comment-text">"{feedback.comment}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FeedbackList
