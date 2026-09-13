import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/common/Icon'
import { useAuth } from '../../hooks/useAuth'

export const LoginPage = () => {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/traces'

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login(formData)
      navigate(redirectTo, { replace: true })
    } catch (requestError) {
      setError(requestError.status === 401 ? 'Invalid credentials' : 'Unable to sign in right now. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-heading">
          <h1 id="login-title">Sign in to Trace Investigator</h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Username</span>
            <input
              autoComplete="username"
              name="username"
              onChange={handleChange}
              required
              type="text"
              value={formData.username}
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              name="password"
              onChange={handleChange}
              required
              type="password"
              value={formData.password}
            />
          </label>

          {error ? <p className="login-error">{error}</p> : null}

          <button className="login-submit" disabled={submitting} type="submit">
            <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
            <Icon name="arrowRight" />
          </button>
        </form>
      </section>
    </main>
  )
}
