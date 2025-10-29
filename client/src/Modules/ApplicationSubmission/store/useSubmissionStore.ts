import create from 'zustand';

type SubmissionState = {
  isModalOpen: boolean;
  submissionStatus: 'idle' | 'loading' | 'success' | 'error';
  openModal: () => void;
  closeModal: () => void;
  setSubmissionStatus: (status: SubmissionState['submissionStatus']) => void;
};

export const useSubmissionStore = create<SubmissionState>((set) => ({
  isModalOpen: false,
  submissionStatus: 'idle',
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false, submissionStatus: 'idle' }),
  setSubmissionStatus: (status) => set({ submissionStatus: status }),
}));
