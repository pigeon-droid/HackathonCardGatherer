import React, { useState, useEffect } from 'react';
import { ScryfallSet, scryfallAPI } from '../services/ScryfallAPI';
import '../styles/SetsBrowser.css';

interface SetsBrowserProps {
  onSelectSet: (set: ScryfallSet) => void;
  selectedSetCode?: string;
}

const SetsBrowser: React.FC<SetsBrowserProps> = ({ onSelectSet, selectedSetCode }) => {
  const [sets, setSets] = useState<ScryfallSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');

  const regularSetTypes = new Set([
    'core',
    'expansion',
    'masters',
    'draft_innovation',
    'commander',
    'starter',
    'box',
    'duel_deck',
    'from_the_vault',
    'premium_deck',
    'spellbook',
    'planechase',
    'archenemy',
    'vanguard',
    'masterpiece',
    'treasure_chest',
    'minigame',
    'funny'
  ]);

  useEffect(() => {
    const fetchSets = async () => {
      try {
        setLoading(true);
        const fetchedSets = await scryfallAPI.getSets();
        // Sort by release date, newest first
        const sorted = fetchedSets.sort((a, b) =>
          new Date(b.released_at).getTime() - new Date(a.released_at).getTime()
        );
        setSets(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sets');
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, []);

  const normalizedFilter = filterText.trim().toLowerCase();
  const filteredSets = normalizedFilter.length === 0
    ? sets
    : sets.filter(set => {
        const code = set.code.toLowerCase();
        const name = set.name.toLowerCase();
        return code.includes(normalizedFilter) || name.includes(normalizedFilter);
      });

  const now = new Date();
  const releasedSets = filteredSets.filter(set => new Date(set.released_at) <= now);
  const upcomingSets = filteredSets.filter(set => new Date(set.released_at) > now);

  const splitByType = (input: ScryfallSet[]) => {
    const regular = input.filter(set => regularSetTypes.has(set.set_type));
    const other = input.filter(set => !regularSetTypes.has(set.set_type));
    return { regular, other };
  };

  const released = splitByType(releasedSets);
  const upcoming = splitByType(upcomingSets);

  if (loading) {
    return <div className="sets-browser loading">Loading Magic sets...</div>;
  }

  if (error) {
    return <div className="sets-browser error">Error: {error}</div>;
  }

  const renderSetList = (list: ScryfallSet[]) => (
    <div className="sets-grid">
      {list.map(set => (
        <button
          key={set.id}
          className={`set-card ${selectedSetCode === set.code ? 'selected' : ''}`}
          onClick={() => onSelectSet(set)}
          title={`Released: ${new Date(set.released_at).toLocaleDateString()}`}
        >
          <div className="set-icon">
            {set.icon_svg_uri && (
              <img src={set.icon_svg_uri} alt={set.code} />
            )}
          </div>
          <div className="set-info">
            <div className="set-name">{set.name}</div>
            <div className="set-code">{set.code.toUpperCase()}</div>
            <div className="set-date">
              {new Date(set.released_at).toLocaleDateString()}
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div className="sets-browser">
      <h2>Magic: The Gathering Sets</h2>
      <p className="sets-info">Click a set to browse and add cards</p>
      <div className="sets-filter">
        <input
          type="text"
          className="sets-filter-input"
          placeholder="Filter sets by name or code..."
          value={filterText}
          onChange={(event) => setFilterText(event.target.value)}
          aria-label="Filter sets"
        />
      </div>

      <div className="sets-group">
        <h3 className="sets-group-title">Regular sets</h3>
        {renderSetList(released.regular)}
      </div>

      <div className="sets-group">
        <h3 className="sets-group-title">Other sets (tokens, art, promos, etc.)</h3>
        {renderSetList(released.other)}
      </div>

      {upcoming.regular.length > 0 && (
        <div className="sets-group">
          <h3 className="sets-group-title">Upcoming regular sets</h3>
          {renderSetList(upcoming.regular)}
        </div>
      )}

      {upcoming.other.length > 0 && (
        <div className="sets-group">
          <h3 className="sets-group-title">Upcoming other sets</h3>
          {renderSetList(upcoming.other)}
        </div>
      )}
    </div>
  );
};

export default SetsBrowser;

