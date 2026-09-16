import React from 'react';

export default function StudentModal({ student, onClose }) {
  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-lg font-bold"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold mb-4 text-gray-800">Student Profile</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><span className="font-semibold">Name:</span> {student.name}</p>
          <p><span className="font-semibold">Email:</span> {student.email}</p>
          <p><span className="font-semibold">Room Number:</span> {student.roomNumber}</p>
          <p><span className="font-semibold">Phone:</span> {student.phone || 'N/A'}</p>
          <p><span className="font-semibold">Course:</span> {student.course || 'N/A'}</p>
          <p><span className="font-semibold">Semester:</span> {student.semester || 'N/A'}</p>
          <p><span className="font-semibold">Rent Status:</span> {student.rentStatus}</p>
          <p><span className="font-semibold">Rent Amount:</span> ₹{student.rentAmount || 5000}</p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}