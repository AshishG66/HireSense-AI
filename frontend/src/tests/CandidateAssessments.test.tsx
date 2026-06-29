import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CandidateAssessments from '../features/candidate/pages/CandidateAssessments';
import api from '../utils/api';

vi.mock('../utils/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('CandidateAssessments page', () => {
  test('renders stats and practice questions lists from mock api endpoints', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        data: {
          problemsSolved: 4,
          streak: 2,
          acceptanceRate: 85,
          upcomingAssessments: [
            {
              id: 'test-1',
              title: 'Mock assessment screening',
              duration: 45,
              questionsCount: 1,
            },
          ],
        },
      },
    });

    (api.get as any).mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 'q-1',
            title: 'Sum of Two Elements',
            category: 'Arrays',
            difficulty: 'EASY',
            points: 10,
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <CandidateAssessments />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sum of Two Elements')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('2 Days')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });
});
