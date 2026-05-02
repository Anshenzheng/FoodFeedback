import React, { useState } from 'react'
import api from '../utils/api'
import './FeedbackForm.css'

function FeedbackForm() {
  const [formData, setFormData] = useState({
    nickname: '',
    visit_date: new Date().toISOString().split('T')[0],
    food_rating: 3,
    service_rating: 3,
    comment: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRatingChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      await api.post('/api/feedback', {
        ...formData,
        food_rating: parseInt(formData.food_rating),
        service_rating: parseInt(formData.service_rating)
      })
      
      setSuccess(true)
      setFormData({
        nickname: '',
        visit_date: new Date().toISOString().split('T')[0],
        food_rating: 3,
        service_rating: 3,
        comment: ''
      })

      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.error || '提交失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating, type) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'active' : ''}`}
            onClick={() => handleRatingChange(type, star)}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="feedback-form-container">
      <div className="form-header">
        <h2 className="form-title">📝 留下您的宝贵反馈</h2>
        <p className="form-subtitle">您的意见是我们进步的动力</p>
      </div>

      {success && (
        <div className="alert alert-success">
          ✅ 感谢您的反馈！提交成功！
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="feedback-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nickname" className="form-label">
              您的昵称 <span className="required">*</span>
            </label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              placeholder="请输入您的昵称"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="visit_date" className="form-label">
              就餐日期 <span className="required">*</span>
            </label>
            <input
              type="date"
              id="visit_date"
              name="visit_date"
              value={formData.visit_date}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group rating-group">
            <label className="form-label">
              🍽️ 菜品评分
            </label>
            <div className="rating-container">
              {renderStars(formData.food_rating, 'food_rating')}
              <span className="rating-value">{formData.food_rating}分</span>
            </div>
            <div className="rating-description">
              <span className="desc-item">1分: 很差</span>
              <span className="desc-item">3分: 一般</span>
              <span className="desc-item">5分: 非常好</span>
            </div>
          </div>

          <div className="form-group rating-group">
            <label className="form-label">
              👨‍🍳 服务评分
            </label>
            <div className="rating-container">
              {renderStars(formData.service_rating, 'service_rating')}
              <span className="rating-value">{formData.service_rating}分</span>
            </div>
            <div className="rating-description">
              <span className="desc-item">1分: 很差</span>
              <span className="desc-item">3分: 一般</span>
              <span className="desc-item">5分: 非常好</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="comment" className="form-label">
            详细评价
          </label>
          <textarea
            id="comment"
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
            placeholder="请分享您的用餐体验...（选填）"
            className="form-textarea"
            rows="4"
          />
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={loading}
        >
          {loading ? '提交中...' : '提交反馈'}
        </button>
      </form>
    </div>
  )
}

export default FeedbackForm
