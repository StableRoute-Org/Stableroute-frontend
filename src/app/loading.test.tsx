import { render } from '@testing-library/react';
import Loading from './loading';
import PairsLoading from './pairs/loading';
import EventsLoading from './events/loading';
import StatsLoading from './stats/loading';

describe('Root Loading skeleton', () => {
  it('exposes the main-content focus target', () => {
    render(<Loading />);
    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('tabIndex', '-1');
  });

  // loading.tsx renders one title bar and two body-line placeholders.
  it('renders three pulse skeleton placeholders', () => {
    const { baseElement } = render(<Loading />);
    expect(baseElement.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });
});

describe('Pairs Loading skeleton', () => {
  it('exposes the main-content focus target', () => {
    render(<PairsLoading />);
    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('tabIndex', '-1');
  });

  it('renders title, filter, and list placeholders', () => {
    const { getByText, baseElement } = render(<PairsLoading />);
    expect(getByText('Pairs')).toBeInTheDocument();
    expect(getByText('Filter pairs')).toBeInTheDocument();
    expect(getByText('Loading pairs')).toBeInTheDocument();
    expect(
      baseElement.querySelectorAll('.animate-pulse').length
    ).toBeGreaterThan(0);
  });
});

describe('Events Loading skeleton', () => {
  it('exposes the main-content focus target', () => {
    render(<EventsLoading />);
    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('tabIndex', '-1');
  });

  it('renders title, filter, and list placeholders', () => {
    const { getByText, baseElement } = render(<EventsLoading />);
    expect(getByText('Event log')).toBeInTheDocument();
    expect(getByText('Filter by event type')).toBeInTheDocument();
    expect(getByText('Loading events')).toBeInTheDocument();
    expect(
      baseElement.querySelectorAll('.animate-pulse').length
    ).toBeGreaterThan(0);
  });
});

describe('Stats Loading skeleton', () => {
  it('exposes the main-content focus target', () => {
    render(<StatsLoading />);
    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('tabIndex', '-1');
  });

  it('renders title and metric tiles', () => {
    const { getByText, baseElement } = render(<StatsLoading />);
    expect(getByText('Stats')).toBeInTheDocument();
    expect(getByText('Loading stats')).toBeInTheDocument();
    expect(
      baseElement.querySelectorAll('.animate-pulse').length
    ).toBeGreaterThan(0);
  });
});
