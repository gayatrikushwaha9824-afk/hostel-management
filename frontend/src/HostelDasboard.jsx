import React, { useState, useEffect } from 'react';

export default function HostelDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roomNumber: '',
    phone: '',
    semester: '',
    course: '',
    rentStatus: 'Pending'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  // Fetch students from backend
  const fetchStudents = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/students?search=${searchTerm}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setStudents(data);
      }
    } catch (err) {
      showToast('Failed to fetch student data', 'error');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
    }
  }, [searchTerm, isAuthenticated]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Form Validation Logic
  const validateForm = () => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      showToast('Please enter a valid 10-digit phone number', 'error');
      return false;
    }
    return true;
  };

  const handleEditClick = (student) => {
    setEditingId(student._id);
    setFormData({
      name: student.name,
      email: student.email,
      roomNumber: student.roomNumber,
      phone: student.phone,
      semester: student.semester,
      course: student.course,
      rentStatus: student.rentStatus
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      roomNumber: '',
      phone: '',
      semester: '',
      course: '',
      rentStatus: 'Pending'
    });
  };

  // Add / Edit Student
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const url = editingId
      ? `http://localhost:5000/api/students/${editingId}`
      : 'http://localhost:5000/api/students';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        showToast(editingId ? 'Student record updated!' : 'New student added successfully!');
        setEditingId(null);
        resetForm();
        fetchStudents();
      } else {
        showToast(data.error || 'Operation failed', 'error');
      }
    } catch (err) {
      showToast('Server error. Could not save record.', 'error');
    }
  };

  // Toggle Rent Status Directly
  const handleToggleRent = async (student) => {
    const updatedStatus = student.rentStatus === 'Paid' ? 'Pending' : 'Paid';
    try {
      const response = await fetch(`http://localhost:5000/api/students/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentStatus: updatedStatus })
      });
      if (response.ok) {
        showToast(`Rent status changed to ${updatedStatus}`);
        fetchStudents();
      }
    } catch (err) {
      showToast('Failed to update rent status', 'error');
    }
  };

  // Delete Student
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student record?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/students/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showToast('Student deleted successfully', 'error');
        fetchStudents();
      }
    } catch (err) {
      showToast('Failed to delete student', 'error');
    }
  };

  // Export Data to CSV
  const exportToCSV = () => {
    if (students.length === 0) {
      showToast('No data available to export', 'error');
      return;
    }
    const headers = ['Name,Email,Room Number,Phone,Semester,Course,Rent Status\n'];
    const rows = students.map(s => 
      `"${s.name}","${s.email}","${s.roomNumber}","${s.phone}","${s.semester}","${s.course}","${s.rentStatus}"`
    );

    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hostel_Students_Report.csv`;
    a.click();
    showToast('Exported CSV file successfully!');
  };

  // Sorting Mechanism
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStudents = [...students].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalStudents = students.length;
  const uniqueRooms = new Set(students.map((s) => s.roomNumber)).size;
  const pendingRent = students.filter((s) => s.rentStatus === 'Pending').length;

  // 1. LOGIN GUARD VIEW
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#ffffff', padding: '32px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center', width: '320px' }}>
          <h2 style={{ margin: '0 0 8px', color: '#111827' }}>Admin Access</h2>
          <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '14px' }}>Enter password to manage hostel records</p>
          <input
            type="password"
            placeholder="Password (default: admin123)"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (passwordInput === 'admin123') setIsAuthenticated(true);
                else alert('Incorrect password');
              }
            }}
            style={{ width: '100%', padding: '10px 14px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', outline: 'none' }}
          />
          <button
            onClick={() => {
              if (passwordInput === 'admin123') setIsAuthenticated(true);
              else alert('Incorrect password');
            }}
            style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Login to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 2. MAIN DASHBOARD VIEW
  return (
    <div style={styles.container}>
      {/* Toast Alert Popup */}
      {toast.message && (
        <div style={{
          ...styles.toast,
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981'
        }}>
          {toast.message}
        </div>
      )}

      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Hostel Management Dashboard</h1>
          <p style={styles.subtitle}>Manage student room allocations, contact records, and rent tracking.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportToCSV} style={styles.exportBtn}>
            📥 Export CSV
          </button>
          <button onClick={() => setIsAuthenticated(false)} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div style={styles.metricsGrid}>
        <div style={{ ...styles.card, borderLeft: '4px solid #3b82f6' }}>
          <span style={styles.metricNumber}>{totalStudents}</span>
          <span style={styles.metricLabel}>Total Students</span>
        </div>
        <div style={{ ...styles.card, borderLeft: '4px solid #10b981' }}>
          <span style={styles.metricNumber}>{uniqueRooms}</span>
          <span style={styles.metricLabel}>Occupied Rooms</span>
        </div>
        <div style={{ ...styles.card, borderLeft: '4px solid #ef4444' }}>
          <span style={styles.metricNumber}>{pendingRent}</span>
          <span style={styles.metricLabel}>Pending Rent</span>
        </div>
      </div>

      {/* Form Card */}
      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>
          {editingId ? 'Edit Student Details' : 'Add New Student'}
        </h3>
        <form onSubmit={handleSubmit} style={styles.formGrid}>
          <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required style={styles.input} />
          <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required style={styles.input} />
          <input type="text" name="roomNumber" placeholder="Room Number" value={formData.roomNumber} onChange={handleChange} required style={styles.input} />
          <input type="text" name="phone" placeholder="Phone Number (10 digits)" value={formData.phone} onChange={handleChange} required style={styles.input} />
          <input type="text" name="semester" placeholder="Semester (e.g. Sem 4)" value={formData.semester} onChange={handleChange} required style={styles.input} />
          <input type="text" name="course" placeholder="Course (e.g. BCA)" value={formData.course} onChange={handleChange} required style={styles.input} />
          
          <select name="rentStatus" value={formData.rentStatus} onChange={handleChange} style={{ ...styles.input, gridColumn: 'span 2' }}>
            <option value="Pending">Rent Status: Pending</option>
            <option value="Paid">Rent Status: Paid</option>
          </select>

          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
            <button type="submit" style={editingId ? styles.updateBtn : styles.submitBtn}>
              {editingId ? 'Update Record' : 'Add Student'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} style={styles.cancelBtn}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="🔍 Search by student name or room number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...styles.input, width: '100%', boxSizing: 'border-box', fontSize: '15px' }}
        />
      </div>

      {/* Table Card */}
      <div style={styles.sectionCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th onClick={() => handleSort('name')} style={{ ...styles.th, cursor: 'pointer' }}>
                Name / Email {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('roomNumber')} style={{ ...styles.th, cursor: 'pointer' }}>
                Room {sortConfig.key === 'roomNumber' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('course')} style={{ ...styles.th, cursor: 'pointer' }}>
                Course & Sem {sortConfig.key === 'course' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={styles.th}>Phone</th>
              <th onClick={() => handleSort('rentStatus')} style={{ ...styles.th, cursor: 'pointer' }}>
                Rent Status {sortConfig.key === 'rentStatus' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.length > 0 ? (
              sortedStudents.map((student) => (
                <tr key={student._id} style={styles.tableRow}>
                  <td style={styles.td}>
                    <strong>{student.name}</strong>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{student.email}</div>
                  </td>
                  <td style={styles.td}><span style={styles.roomBadge}>{student.roomNumber}</span></td>
                  <td style={styles.td}>{student.course} ({student.semester})</td>
                  <td style={styles.td}>{student.phone}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleToggleRent(student)}
                      style={student.rentStatus === 'Paid' ? styles.badgePaid : styles.badgePending}
                      title="Click to toggle status"
                    >
                      {student.rentStatus}
                    </button>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEditClick(student)} style={styles.editBtn}>Edit</button>
                      <button onClick={() => handleDelete(student._id)} style={styles.deleteBtn}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', padding: '24px' }}>
                  No student records match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '32px 16px', fontFamily: '"Inter", system-ui, sans-serif', color: '#1f2937', backgroundColor: '#f9fafb', minHeight: '100vh', position: 'relative' },
  toast: { position: 'fixed', top: '20px', right: '20px', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 1000 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { margin: 0, fontSize: '28px', fontWeight: 700, color: '#111827' },
  subtitle: { margin: '4px 0 0', color: '#6b7280', fontSize: '14px' },
  exportBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' },
  logoutBtn: { background: '#6b7280', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  card: { background: '#ffffff', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  metricNumber: { fontSize: '28px', fontWeight: 700, color: '#111827' },
  metricLabel: { fontSize: '13px', color: '#6b7280', fontWeight: 500 },
  sectionCard: { background: '#ffffff', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' },
  sectionTitle: { margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: '#111827' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', backgroundColor: '#ffffff', color: '#111827' },
  submitBtn: { flex: 1, padding: '10px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' },
  updateBtn: { flex: 1, padding: '10px', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { padding: '10px 16px', background: '#9ca3af', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  tableHeaderRow: { background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' },
  th: { padding: '12px 16px', fontWeight: 600, color: '#374151' },
  tableRow: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '14px 16px', verticalAlign: 'middle', color: '#1f2937' },
  roomBadge: { background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '12px' },
  badgePaid: { background: '#d1fae5', color: '#065f46', border: 'none', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' },
  badgePending: { background: '#fee2e2', color: '#991b1b', border: 'none', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' },
  editBtn: { background: '#f3f4f6', border: '1px solid #d1d5db', color: '#374151', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 },
  deleteBtn: { background: '#ef4444', border: 'none', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }
};