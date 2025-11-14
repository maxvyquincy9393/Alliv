/**
 * Nearby Creators Demo Page
 * Showcases the new Leaflet.js map implementation
 */

import { useState } from 'react';
import LeafletMap from '../components/LeafletMap';

interface User {
  id: string;
  name: string;
  age: number;
  field?: string;
  skill?: string;
  photos?: string[];
  lat?: number;
  lng?: number;
  distance?: number;
  compatibility?: number;
}

export default function NearbyCreators() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [radius, setRadius] = useState(10);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  return (
    <div className="nearby-creators-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Nearby Creators</h1>
          <p className="page-subtitle">
            Discover talented creators near you using OpenStreetMap
          </p>
        </div>

        {/* Radius Control */}
        <div className="radius-control">
          <label htmlFor="radius-slider" className="radius-label">
            Search Radius: <span className="radius-value">{radius} km</span>
          </label>
          <input
            id="radius-slider"
            type="range"
            min="1"
            max="50"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="radius-slider"
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="map-wrapper">
        <LeafletMap
          onUserClick={handleUserClick}
          radius={radius}
          enableGeolocation={true}
          enableRealTimeUpdates={false}
        />
      </div>

      {/* Selected User Card (Modal) */}
      {selectedUser && (
        <div className="user-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedUser(null)}
              aria-label="Close"
            >
              ✕
            </button>

            <div className="modal-content">
              {/* Avatar */}
              <div className="modal-avatar">
                {selectedUser.photos?.[0] ? (
                  <img src={selectedUser.photos[0]} alt={selectedUser.name} />
                ) : (
                  <div className="modal-avatar-placeholder">
                    {selectedUser.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <h2 className="modal-name">
                {selectedUser.name}, {selectedUser.age}
              </h2>
              {selectedUser.skill && (
                <p className="modal-skill">{selectedUser.skill}</p>
              )}
              {selectedUser.field && (
                <p className="modal-field">
                  <span>💼</span>
                  {selectedUser.field}
                </p>
              )}

              {/* Stats */}
              <div className="modal-stats">
                <div className="modal-stat">
                  <span className="stat-icon">📍</span>
                  <div className="stat-content">
                    <span className="stat-label">Distance</span>
                    <span className="stat-value">{selectedUser.distance} km</span>
                  </div>
                </div>
                {selectedUser.compatibility && (
                  <div className="modal-stat">
                    <span className="stat-icon">⚡</span>
                    <div className="stat-content">
                      <span className="stat-label">Match</span>
                      <span className="stat-value">{selectedUser.compatibility}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button className="btn-secondary">
                  <span>💬</span>
                  <span>Message</span>
                </button>
                <button className="btn-primary">
                  <span>👤</span>
                  <span>View Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .nearby-creators-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          padding: 24px;
        }

        .page-header {
          max-width: 1400px;
          margin: 0 auto 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
        }

        .header-content {
          flex: 1;
          min-width: 300px;
        }

        .page-title {
          font-size: 36px;
          font-weight: 800;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 8px 0;
        }

        .page-subtitle {
          font-size: 16px;
          color: #9ca3af;
          margin: 0;
        }

        .radius-control {
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 16px;
          padding: 20px 24px;
          min-width: 300px;
        }

        .radius-label {
          display: block;
          font-size: 14px;
          color: #d1d5db;
          margin-bottom: 12px;
          font-weight: 600;
        }

        .radius-value {
          color: #8b5cf6;
          font-weight: 700;
          font-size: 16px;
        }

        .radius-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(to right, 
            #8b5cf6 0%, 
            #8b5cf6 ${(radius / 50) * 100}%, 
            #374151 ${(radius / 50) * 100}%, 
            #374151 100%
          );
          outline: none;
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
        }

        .radius-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
          transition: all 0.2s ease;
        }

        .radius-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.6);
        }

        .radius-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
          transition: all 0.2s ease;
        }

        .radius-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.6);
        }

        .map-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          height: 700px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        }

        /* User Modal */
        .user-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .user-modal {
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 24px;
          max-width: 500px;
          width: 100%;
          position: relative;
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.8);
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.3);
          color: #8b5cf6;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 1;
        }

        .modal-close:hover {
          background: rgba(139, 92, 246, 0.3);
          transform: rotate(90deg);
        }

        .modal-content {
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .modal-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid #8b5cf6;
          box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
        }

        .modal-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .modal-avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 700;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          color: white;
        }

        .modal-name {
          font-size: 28px;
          font-weight: 700;
          color: white;
          margin: 0;
          text-align: center;
        }

        .modal-skill {
          font-size: 16px;
          color: #a855f7;
          margin: 0;
          font-weight: 600;
          text-align: center;
        }

        .modal-field {
          font-size: 14px;
          color: #9ca3af;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-stats {
          display: flex;
          gap: 24px;
          width: 100%;
          padding: 24px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 16px;
          margin-top: 8px;
        }

        .modal-stat {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stat-icon {
          font-size: 32px;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: white;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          width: 100%;
          margin-top: 8px;
        }

        .btn-secondary,
        .btn-primary {
          flex: 1;
          padding: 14px 20px;
          border-radius: 12px;
          border: none;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .btn-secondary {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .btn-secondary:hover {
          background: rgba(139, 92, 246, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .btn-primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
        }

        .btn-primary:active,
        .btn-secondary:active {
          transform: translateY(0);
        }

        /* Mobile Responsive - 390x844 */
        @media (max-width: 480px) {
          .nearby-creators-page {
            padding: 16px;
          }

          .page-header {
            flex-direction: column;
            align-items: stretch;
            margin-bottom: 16px;
          }

          .page-title {
            font-size: 28px;
          }

          .page-subtitle {
            font-size: 14px;
          }

          .radius-control {
            width: 100%;
            min-width: unset;
          }

          .map-wrapper {
            height: 500px;
            border-radius: 16px;
          }

          .user-modal {
            margin: 0;
            border-radius: 20px 20px 0 0;
            align-self: flex-end;
            max-width: 100%;
          }

          .modal-content {
            padding: 32px 24px;
            gap: 16px;
          }

          .modal-avatar {
            width: 100px;
            height: 100px;
          }

          .modal-name {
            font-size: 24px;
          }

          .modal-stats {
            flex-direction: column;
            gap: 16px;
            padding: 20px;
          }

          .modal-actions {
            flex-direction: column;
          }

          .btn-secondary,
          .btn-primary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
