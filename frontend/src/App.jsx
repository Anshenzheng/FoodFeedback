import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import FeedbackForm from './components/FeedbackForm'
import FeedbackList from './components/FeedbackList'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import './App.css'

function App() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    setIsAdmin(!!token)
  }, [])

  const handleLogin = () => {
    setIsAdmin(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsAdmin(false)
  }

  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="container">
            <div className="header-content">
              <Link to="/" className="logo">
                <span className="logo-icon">🍽️</span>
                <span className="logo-text">美味轩反馈系统</span>
              </Link>
              <nav className="nav">
                <Link to="/" className="nav-link">首页</Link>
                <Link to="/feedback" className="nav-link">反馈列表</Link>
                {isAdmin ? (
                  <>
                    <Link to="/admin/dashboard" className="nav-link">管理后台</Link>
                    <button onClick={handleLogout} className="nav-btn">退出登录</button>
                  </>
                ) : (
                  <Link to="/admin/login" className="nav-link">管理员登录</Link>
                )}
              </nav>
            </div>
          </div>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/feedback" element={<FeedbackListPage />} />
            <Route 
              path="/admin/login" 
              element={
                isAdmin ? <Navigate to="/admin/dashboard" /> : <AdminLogin onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                isAdmin ? <AdminDashboard /> : <Navigate to="/admin/login" />
              } 
            />
          </Routes>
        </main>

        <footer className="footer">
          <div className="container">
            <p>© 2026 美味轩饭店. 感谢您的反馈！</p>
          </div>
        </footer>
      </div>
    </Router>
  )
}

function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">您的意见，我们的进步</h1>
            <p className="hero-subtitle">
              欢迎来到美味轩饭店！您的用餐体验对我们至关重要。
              请花几分钟时间分享您的感受，帮助我们做得更好。
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-icon">⭐</span>
                <span className="stat-label">五星服务</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🥘</span>
                <span className="stat-label">精选菜品</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">💝</span>
                <span className="stat-label">用心服务</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="feedback-section">
        <div className="container">
          <FeedbackForm />
        </div>
      </section>
    </div>
  )
}

function FeedbackListPage() {
  return (
    <div className="feedback-list-page">
      <div className="container">
        <FeedbackList />
      </div>
    </div>
  )
}

export default App
