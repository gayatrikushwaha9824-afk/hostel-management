import React, { useState, useEffect } from 'react';
import { API_BASE, getAuthHeaders } from './api';
import StudentModal from './StudentModal';

export default function HostelDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roomNumber: '',
    phone: '',
    semester: '',
    course: '',
    rentStatus: 'Pending',
    rentAmount: 5000
  });

  // Check login state on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchStudents();
    }
  }, []);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('token', data.token);
      setIsAuthenticated(true);
      setPasswordInput('');
      fetchStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setStudents([]);
  };

  // Fetch all students
  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/students`);
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  // Add new student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to save student');
        return;
      }

      setStudents((prev) => [data, ...prev]);
      setFormData({
        name: '',
        email: '',
        roomNumber: '',
        phone: '',
        semester: '',
        course: '',
        rentStatus: 'Pending',
        rentAmount: 5000
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Quick toggle rent status
  const handleToggleRent = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/students/${id}/toggle-rent`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || 'Error updating rent');

      setStudents((prev) => prev.map((s) => (s._id === id ? updated : s)));
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete student
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this student?')) return;

    try {
      const res = await fetch(`${API_BASE}/students/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Delete failed');

      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (students.length === 0) return alert('No records available to export');

    const headers = ['Name', 'Email', 'Room Number', 'Phone', 'Semester', 'Course', 'Rent Status', 'Rent Amount'];
    const rows = students.map((s) => [
      `"${s.name || ''}"`,
      `"${s.email || ''}"`,
      `"${s.roomNumber || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.semester || ''}"`,
      `"${s.course || ''}"`,
      `"${s.rentStatus || ''}"`,
      s.rentAmount || 5000
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `hostel_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics calculations
  const totalStudents = students.length;
  const occupiedRooms = new Set(students.map((s) => s.roomNumber)).size;
  const pendingRentCount = students.filter((s) => s.rentStatus === 'Pending').length;

  // Filter list
  const filteredStudents = students.filter((student) => {
    const q = searchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(q) ||
      student.roomNumber?.toString().toLowerCase().includes(q)
    );
  });

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f3f4f6' }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '16px' }}>Hostel Management Login</h2>
          <input
            type="password"
            placeholder="Enter Admin Password (default: admin123)"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
            required
          />
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Hostel Management Dashboard</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Manage student room allocations, records, and rent tracking.</p>
        </div>
        <div>
          <button onClick={handleExportCSV} style={{ marginRight: '8px', padding: '8px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Export CSV
          </button>
          <button onClick={handleLogout} style={{ padding: '8px 14px', background: '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: '#f9fafb', borderLeft: '4px solid #3b82f6', borderRadius: '4px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{totalStudents}</h3>
          <span style={{ color: '#6b7280', fontSize: '14px' }}>Total Students</span>
        </div>
        <div style={{ padding: '16px', background: '#f9fafb', borderLeft: '4px solid #10b981', borderRadius: '4px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{occupiedRooms}</h3>
          <span style={{ color: '#6b7280', fontSize: '14px' }}>Occupied Rooms</span>
        </div>
        <div style={{ padding: '16px', background: '#f9fafb', borderLeft: '4px solid #ef4444', borderRadius: '4px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{pendingRentCount}</h3>
          <span style={{ color: '#6b7280', fontSize: '14px' }}>Pending Rent</span>
        </div>
      </div>

      {/* Add Student Form */}
      <form onSubmit={handleAddStudent} style={{ background: '#fff', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Add New Student</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            required
          />
          <input
            type="text"
            placeholder="Room Number (e.g. 101)"
            value={formData.roomNumber}
            onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
            style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            required
          />
          <input
            type="text"
            placeholder="Phone Number (10 digits)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="Semester (e.g. Sem 4)"
            value={formData.semester}
            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="Course (e.g. BCA)"
            value={formData.course}
            onChange={(e) => setFormData({ ...formData, course: e.target.value })}
            style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', marginTop: '14px', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Add Student
        </button>
      </form>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="🔍 Search by student name or room number..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '16px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
      />

      {/* Students Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff', border: '1px solid #e5e7eb' }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ padding: '12px' }}>Name</th>
            <th style={{ padding: '12px' }}>Room</th>
            <th style={{ padding: '12px' }}>Course / Sem</th>
            <th style={{ padding: '12px' }}>Rent Status</th>
            <th style={{ padding: '12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <tr
                key={student._id}
                onClick={() => setSelectedStudent(student)}
                style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }}
              >
                <td style={{ padding: '12px' }}>{student.name}</td>
                <td style={{ padding: '12px' }}>{student.roomNumber}</td>
                <td style={{ padding: '12px' }}>{student.course} ({student.semester})</td>
                <td style={{ padding: '12px' }}>
                  <button
                    onClick={(e) => handleToggleRent(e, student._id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      background: student.rentStatus === 'Paid' ? '#dcfce7' : '#fee2e2',
                      color: student.rentStatus === 'Paid' ? '#15803d' : '#b91c1c'
                    }}
                  >
                    {student.rentStatus}
                  </button>
                </td>
                <td style={{ padding: '12px' }}>
                  <button
                    onClick={(e) => handleDelete(e, student._id)}
                    style={{ padding: '4px 8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                No students found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Profile Modal */}
      <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}

