import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createApplicant, getShopById, uploadResume } from '../lib/api';
import { POSITIONS, SOURCES, ASE_CERTS, TECH_POSITIONS, type Shop } from '../lib/types';

export function Apply() {
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get('shop');
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopError, setShopError] = useState('');
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    position_applied: '',
    source: '',
    experience_years: '',
    current_employer: '',
    expected_pay: '',
    available_start: '',
    has_tools: '',
    has_valid_license: false,
    can_work_saturdays: false,
    certifications: [] as string[],
    notes: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shopId) {
      setShopError('No shop specified. Please use a valid application link.');
      return;
    }
    getShopById(shopId)
      .then(setShop)
      .catch(() => setShopError('Shop not found. Please check your application link.'));
  }, [shopId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCertChange = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert],
    }));
  };

  const isTechPosition = TECH_POSITIONS.includes(formData.position_applied);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    setError('');
    setLoading(true);

    try {
      let resume_url: string | undefined;
      if (resumeFile) {
        resume_url = await uploadResume(resumeFile);
      }

      const form_data = {
        experience_years: formData.experience_years ? Number(formData.experience_years) : null,
        current_employer: formData.current_employer || null,
        expected_pay: formData.expected_pay || null,
        available_start: formData.available_start || null,
        has_tools: formData.has_tools || null,
        has_valid_license: formData.has_valid_license,
        can_work_saturdays: formData.can_work_saturdays,
        certifications: formData.certifications,
        notes: formData.notes || null,
        resume_url: resume_url || null,
      };

      await createApplicant({
        shop_id: shopId,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        position_applied: formData.position_applied,
        source: formData.source || undefined,
        form_data,
      });

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (shopError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-gray-600">{shopError}</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for applying to {shop.name}. We will review your application and get back to you soon.
          </p>
          <button onClick={() => { setSubmitted(false); setStep(1); }} className="text-blue-600 hover:text-blue-500">
            Submit another application
          </button>
        </div>
      </div>
    );
  }

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Join {shop.name}</h1>
          <p className="mt-2 text-gray-600">Fill out the form below to apply for a position</p>
        </div>

        <div className="flex justify-center mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-12 h-1 ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
          {error && <div className="bg-red-50 text-red-800 rounded-md p-4">{error}</div>}

          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input type="text" name="full_name" required className="input" value={formData.full_name} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input type="tel" name="phone" required className="input" value={formData.phone} onChange={handleChange} />
                </div>
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" name="email" required className="input" value={formData.email} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Position *</label>
                  <select name="position_applied" required className="input" value={formData.position_applied} onChange={handleChange}>
                    <option value="">Select a position</option>
                    {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">How did you hear about us?</label>
                  <select name="source" className="input" value={formData.source} onChange={handleChange}>
                    <option value="">Select</option>
                    {SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
                  </select>
                </div>
              </div>
              <button type="button" onClick={nextStep} disabled={!formData.full_name || !formData.phone || !formData.email || !formData.position_applied} className="w-full btn btn-primary py-3 disabled:opacity-50">
                Next Step
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Experience</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Years of Experience</label>
                  <input type="number" name="experience_years" min="0" max="50" className="input" value={formData.experience_years} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Current/Previous Employer</label>
                  <input type="text" name="current_employer" className="input" value={formData.current_employer} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Expected Pay</label>
                  <input type="text" name="expected_pay" placeholder="e.g., $25/hr" className="input" value={formData.expected_pay} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Available Start Date</label>
                  <input type="date" name="available_start" className="input" value={formData.available_start} onChange={handleChange} />
                </div>
              </div>
              <div>
                <label className="label">Resume (PDF or Image)</label>
                <input type="file" accept=".pdf,image/*" onChange={e => setResumeFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="flex-1 btn bg-gray-200 text-gray-800 hover:bg-gray-300 py-3">Back</button>
                <button type="button" onClick={nextStep} className="flex-1 btn btn-primary py-3">Next Step</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Skills & Availability</h2>
              
              {isTechPosition && (
                <>
                  <div>
                    <label className="label">Do you have your own tools?</label>
                    <select name="has_tools" className="input" value={formData.has_tools} onChange={handleChange}>
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="Some">Some</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">ASE Certifications</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {ASE_CERTS.map(cert => (
                        <label key={cert} className="flex items-center space-x-2 cursor-pointer">
                          <input type="checkbox" checked={formData.certifications.includes(cert)} onChange={() => handleCertChange(cert)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm text-gray-700">{cert}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" name="has_valid_license" checked={formData.has_valid_license} onChange={handleChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">I have a valid drivers license</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" name="can_work_saturdays" checked={formData.can_work_saturdays} onChange={handleChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">I can work Saturdays</span>
                </label>
              </div>

              <div>
                <label className="label">Why do you want to work with us?</label>
                <textarea name="notes" rows={4} className="input" value={formData.notes} onChange={handleChange} />
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="flex-1 btn bg-gray-200 text-gray-800 hover:bg-gray-300 py-3">Back</button>
                <button type="submit" disabled={loading} className="flex-1 btn btn-primary py-3">
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          Already work here?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-500">Sign in to admin</Link>
        </p>
      </div>
    </div>
  );
}
