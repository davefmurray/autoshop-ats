import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApplicant, updateApplicant, deleteApplicant, listNotes, createNote } from '../lib/api';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { STATUSES, type Status } from '../lib/types';

export function ApplicantView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');

  const { data: applicant, isLoading: applicantLoading } = useQuery({
    queryKey: ['applicant', id],
    queryFn: () => getApplicant(id!),
    enabled: !!id,
  });

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['notes', id],
    queryFn: () => listNotes(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { status: Status }) => updateApplicant(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant', id] });
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteApplicant(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      navigate('/');
    },
  });

  const noteMutation = useMutation({
    mutationFn: (message: string) => createNote(id!, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
      setNewNote('');
    },
  });

  const handleStatusChange = (newStatus: Status) => {
    if (confirm(`Change status to ${newStatus}?`)) {
      updateMutation.mutate({ status: newStatus });
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this applicant? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      noteMutation.mutate(newNote.trim());
    }
  };

  if (applicantLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!applicant) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Applicant not found</p>
          <Link to="/" className="text-blue-600 hover:text-blue-500 mt-4 inline-block">
            Back to dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const getNextStatuses = (current: Status): Status[] => {
    const idx = STATUSES.indexOf(current);
    const next: Status[] = [];
    if (idx < STATUSES.length - 2) next.push(STATUSES[idx + 1]);
    if (!['HIRED', 'REJECTED'].includes(current)) {
      next.push('HIRED', 'REJECTED');
    }
    return next.filter(s => s !== current);
  };

  // Get form_data values with defaults
  const formData = applicant.form_data || {};
  const certifications = formData.certifications || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
              ← Back to applicants
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{applicant.full_name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={applicant.status as Status} />
              <span className="text-gray-500">{applicant.position_applied}</span>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="btn btn-danger"
            disabled={deleteMutation.isPending}
          >
            Delete
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a href={`tel:${applicant.phone}`} className="text-blue-600 hover:text-blue-800">
                    {applicant.phone}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${applicant.email}`} className="text-blue-600 hover:text-blue-800">
                    {applicant.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Experience */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Experience & Qualifications</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Years of Experience</p>
                  <p className="font-medium">{formData.experience_years ?? 'Not specified'} {formData.experience_years ? 'years' : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expected Pay</p>
                  <p className="font-medium">{formData.expected_pay || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current/Previous Employer</p>
                  <p className="font-medium">{formData.current_employer || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available Start</p>
                  <p className="font-medium">{formData.available_start || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Certifications</p>
                  {certifications.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {certifications.map((cert: string) => (
                        <span key={cert} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                          {cert}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">None listed</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Has Tools</p>
                    <p className="font-medium">{formData.has_tools || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valid License</p>
                    <p className="font-medium">{formData.has_valid_license ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Can Work Saturdays</p>
                    <p className="font-medium">{formData.can_work_saturdays ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {formData.resume_url && (
                  <div>
                    <p className="text-sm text-gray-500">Resume</p>
                    <a
                      href={formData.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Resume →
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Notes & Activity</h2>

              {/* Add note form */}
              <form onSubmit={handleAddNote} className="mb-6">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="input mb-2"
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newNote.trim() || noteMutation.isPending}
                >
                  {noteMutation.isPending ? 'Adding...' : 'Add Note'}
                </button>
              </form>

              {/* Notes list */}
              {notesLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : notes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No notes yet</p>
              ) : (
                <div className="space-y-4">
                  {notes.map((note: any) => (
                    <div key={note.id} className="border-l-2 border-gray-200 pl-4 py-2">
                      <p className="text-gray-900">{note.message}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {note.added_by} • {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Quick Info</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Source</p>
                  <p className="font-medium">{applicant.source || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Applied</p>
                  <p className="font-medium">{new Date(applicant.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-medium">{new Date(applicant.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Status Actions */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Update Status</h2>
              <div className="space-y-2">
                {getNextStatuses(applicant.status as Status).map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={updateMutation.isPending}
                    className={'w-full btn ' + (
                      status === 'HIRED' ? 'btn-success' :
                      status === 'REJECTED' ? 'btn-danger' :
                      'btn-secondary'
                    )}
                  >
                    Move to {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Application Notes */}
            {formData.notes && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Application Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{formData.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
