import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createApplicant, uploadResume } from '../lib/api';
import { POSITIONS, SOURCES } from '../lib/types';

const ASE_CERTIFICATIONS = [
  'ASE A1 - Engine Repair',
  'ASE A2 - Automatic Transmission',
  'ASE A3 - Manual Drive Train',
  'ASE A4 - Suspension & Steering',
  'ASE A5 - Brakes',
  'ASE A6 - Electrical/Electronic',
  'ASE A7 - Heating & AC',
  'ASE A8 - Engine Performance',
];

export function Apply() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    position: '',
    experience_years: 0,
    certifications: [] as string[],
    expected_pay: '',
    source: '',
    notes: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCertChange = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let resume_url: string | undefined;

      // Upload resume if provided
      if (resumeFile) {
        resume_url = await uploadResume(resumeFile);
      }

      // Create applicant
      await createApplicant({
        ...formData,
        experience_years: Number(formData.experience_years),
        resume_url,
      });

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your interest. We'll review your application and get back to you soon.
          </p>
          <Link to="/apply" onClick={() => setSubmitted(false)} className="text-blue-600 hover:text-blue-500">
            Submit another application
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Join Our Team</h1>
          <p className="mt-2 text-gray-600">Fill out the form below to apply for a position</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-800 rounded-md p-4">{error}</div>
          )}

          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                className="input"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input
                type="tel"
                name="phone"
                required
                className="input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              name="email"
              required
              className="input"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Job Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Position *</label>
              <select
                name="position"
                required
                className="input"
                value={formData.position}
                onChange={handleChange}
              >
                <option value="">Select a position</option>
                {POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Years of Experience</label>
              <input
                type="number"
                name="experience_years"
                min="0"
                max="50"
                className="input"
                value={formData.experience_years}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="label">Expected Pay</label>
            <input
              type="text"
              name="expected_pay"
              placeholder="e.g., $25/hr or $52,000/year"
              className="input"
              value={formData.expected_pay}
              onChange={handleChange}
            />
          </div>

          {/* Certifications */}
          <div>
            <label className="label">ASE Certifications</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {ASE_CERTIFICATIONS.map(cert => (
                <label key={cert} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.certifications.includes(cert)}
                    onChange={() => handleCertChange(cert)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{cert}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="label">How did you hear about us?</label>
            <select
              name="source"
              className="input"
              value={formData.source}
              onChange={handleChange}
            >
              <option value="">Select</option>
              {SOURCES.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/* Resume */}
          <div>
            <label className="label">Resume (PDF)</label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Why do you want to work with us?</label>
            <textarea
              name="notes"
              rows={4}
              className="input"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          Already work here?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-500">
            Sign in to admin
          </Link>
        </p>
      </div>
    </div>
  );
}
