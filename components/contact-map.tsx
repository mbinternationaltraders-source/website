"use client";
import { MapPin } from "lucide-react";
import { site } from "@/lib/site";
import { usePreferences } from "./preferences";
export function ContactMap() {
  const { choices, save } = usePreferences();
  return (
    <>
      <div className="map-panel">
        {choices?.maps ? (
          <iframe
            title="MB International Traders location in Gujranwala"
            src={site.mapEmbed}
            loading="lazy"
            referrerPolicy="no-referrer"
            allowFullScreen
          />
        ) : (
          <div className="map-placeholder">
            <MapPin size={23} />
            <h2>Meet us in Gujranwala.</h2>
            <p>
              Load Google Maps to view our location. This connects to Google and
              may use cookies. You can change this choice in Cookie preferences.
            </p>
            <button
              className="button button-small"
              onClick={() =>
                save(
                  choices?.analytics ?? false,
                  true,
                  choices?.motion !== false,
                )
              }
            >
              Load map
            </button>
            <a
              className="text-link"
              href={site.directions}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get directions
            </a>
          </div>
        )}
      </div>
      <div className="map-note">
        <span>{site.address.plusCode} · Gujranwala, Pakistan</span>
        <a href={site.directions} target="_blank" rel="noopener noreferrer">
          Open in Google Maps
        </a>
      </div>
    </>
  );
}
