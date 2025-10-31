import axios from 'axios';

const API_BASE_URL = '/api/automation';

export interface AutomationStartResponse {
  job_id: string;
  status: string;
  message: string;
}

export const startAutomatedSubmission = async (jobId: number): Promise<AutomationStartResponse> => {
  const response = await axios.post(`${API_BASE_URL}/start`, { jobId });
  return response.data;
};

export const getAutomationStatus = async () => {
  const response = await axios.get(`${API_BASE_URL}/status`);
  return response.data;
};
