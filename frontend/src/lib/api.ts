import { supabase } from './supabase';
import type { Applicant, ApplicantListItem, ApplicantCreate, ApplicantUpdate, Note, NoteCreate } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return {};
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
  };
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeader = await getAuthHeader();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
  });
}

// Applicants API
export async function createApplicant(data: ApplicantCreate): Promise<Applicant> {
  // Public endpoint - no auth required
  const response = await fetch(`${API_URL}/api/applicants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create applicant');
  }
  return response.json();
}

export async function listApplicants(params?: {
  status?: string;
  position?: string;
  search?: string;
}): Promise<ApplicantListItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.position) searchParams.set('position', params.position);
  if (params?.search) searchParams.set('search', params.search);

  const queryString = searchParams.toString();
  const url = `${API_URL}/api/applicants${queryString ? '?' + queryString : ''}`;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch applicants');
  }
  return response.json();
}

export async function getApplicant(id: string): Promise<Applicant> {
  const response = await fetchWithAuth(`${API_URL}/api/applicants/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch applicant');
  }
  return response.json();
}

export async function updateApplicant(id: string, data: ApplicantUpdate): Promise<Applicant> {
  const response = await fetchWithAuth(`${API_URL}/api/applicants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update applicant');
  }
  return response.json();
}

export async function deleteApplicant(id: string): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/api/applicants/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete applicant');
  }
}

// Notes API
export async function listNotes(applicantId: string): Promise<Note[]> {
  const response = await fetchWithAuth(`${API_URL}/api/applicants/${applicantId}/notes`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch notes');
  }
  return response.json();
}

export async function createNote(applicantId: string, data: NoteCreate): Promise<Note> {
  const response = await fetchWithAuth(`${API_URL}/api/applicants/${applicantId}/notes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create note');
  }
  return response.json();
}

// Upload API
export async function getResumeUploadUrl(fileName: string, contentType: string = 'application/pdf'): Promise<{
  upload_url: string;
  public_url: string;
}> {
  const response = await fetch(`${API_URL}/api/upload/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_name: fileName, content_type: contentType }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get upload URL');
  }
  return response.json();
}

export async function uploadResume(file: File): Promise<string> {
  const { upload_url, public_url } = await getResumeUploadUrl(file.name, file.type);

  const uploadResponse = await fetch(upload_url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload resume');
  }

  return public_url;
}
