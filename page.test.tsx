import { render, screen } from '@testing-library/react';
import DocsPage from './page';
import { endpointRegistry, Endpoint } from '@/lib/endpointRegistry';

// Mock the registry module
jest.mock('@/lib/endpointRegistry', () => ({
  __esModule: true,
  endpointRegistry: [],
}));

// Mock the client component for the OpenAPI link
jest.mock('./OpenApiLink', () => ({
  OpenApiLink: () => <a href="#">OpenAPI specification</a>,
}));

const mockEndpointRegistry = endpointRegistry as jest.Mocked<typeof endpointRegistry>;

describe('DocsPage', () => {
  afterEach(() => {
    // Reset mock after each test
    (mockEndpointRegistry as unknown as Endpoint[]) = [];
  });

  it('renders the main heading and description', () => {
    render(<DocsPage />);
    expect(screen.getByRole('heading', { name: /API Documentation/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Reference for the StableRoute HTTP API endpoints./i)).toBeInTheDocument();
  });

  it('renders a message when the endpoint registry is empty', () => {
    render(<DocsPage />);
    expect(screen.getByText('No endpoint definitions available.')).toBeInTheDocument();
  });

  it('renders a single endpoint without parameters', () => {
    (mockEndpointRegistry as unknown as Endpoint[]) = [
      { method: 'GET', path: '/api/v1/test', description: 'A test endpoint.' },
    ];
    render(<DocsPage />);
    expect(screen.getByRole('heading', { name: /GET \/api\/v1\/test/i })).toBeInTheDocument();
    expect(screen.getByText('A test endpoint.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Parameters/i })).not.toBeInTheDocument();
  });

  it('renders an endpoint with parameters', () => {
    (mockEndpointRegistry as unknown as Endpoint[]) = [
      {
        method: 'POST',
        path: '/api/v1/submit',
        description: 'Submits data.',
        params: [{ name: 'data', type: 'string', description: 'The data to submit.', required: true }],
      },
    ];
    render(<DocsPage />);
    expect(screen.getByRole('heading', { name: /POST \/api\/v1\/submit/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Parameters/i })).toBeInTheDocument();
    expect(screen.getByText(/data \(string\)/)).toBeInTheDocument();
    expect(screen.getByText(/The data to submit./)).toBeInTheDocument();
    expect(screen.getByText('*required')).toBeInTheDocument();
  });
});