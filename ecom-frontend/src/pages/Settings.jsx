import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../api/api';

export default function Settings() {
  const { user, loading, login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    age: '', // For supplier request
  });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        age: user.profile?.age || '', // Assuming age is in profile
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.patch('users/me/update/', {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
      });
      // Re-fetch user data to update context
      // A simpler way to update user in context without re-login might be needed
      // For now, we'll just show success message
      setMessage('Profile updated successfully!');
      // Optionally, refresh user data in AuthContext if login function doesn't do it
      // For a full refresh, you might need to call a specific context method or re-authenticate
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.response?.data?.error || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      // Assuming a backend endpoint for password change
      await api.post('users/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setMessage('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error('Password change failed:', err);
      setError(err.response?.data?.detail || 'Failed to change password.');
    }
  };

  const handleSupplierRequest = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!formData.age) {
      setError('Please enter your age to request supplier status.');
      return;
    }
    try {
      const res = await api.post('users/request-supplier/', { age: formData.age });
      setMessage(res.data.detail || 'Supplier request submitted successfully!');
    } catch (err) {
      console.error('Supplier request failed:', err);
      setError(err.response?.data?.error || 'Failed to submit supplier request.');
    }
  };

  if (loading || !user) {
    return <div className="container">Loading settings...</div>;
  }

  return (
    <div className="container">
      <h1>Settings</h1>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleProfileUpdate} className="auth-form">
        <h3>Personal Information</h3>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="first_name">First Name</label>
          <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} />
        </div>
        <div className="form-group">
          <label htmlFor="last_name">Last Name</label>
          <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} />
        </div>
        <button type="submit" className="btn-primary">Update Profile</button>
      </form>

      <form onSubmit={handleChangePassword} className="auth-form" style={{ marginTop: '20px' }}>
        <h3>Change Password</h3>
        <div className="form-group">
          <label htmlFor="oldPassword">Current Password</label>
          <input type="password" id="oldPassword" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="confirmNewPassword">Confirm New Password</label>
          <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary">Change Password</button>
      </form>

      {user.profile?.role === 'Client' && user.profile?.is_approved && (
        <div className="request-supplier-section auth-form" style={{ marginTop: '20px' }}>
          <h3>Request to be a Supplier</h3>
          <p>Fill out the form below to request supplier status. Your request will be reviewed by an admin.</p>
          <form onSubmit={handleSupplierRequest}>
            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input type="number" id="age" name="age" value={formData.age} onChange={handleInputChange} required />
            </div>
            <button type="submit" className="btn-primary">Submit Request</button>
          </form>
        </div>
      )}
    </div>
  );
}
