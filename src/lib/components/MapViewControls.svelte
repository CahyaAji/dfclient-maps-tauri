<script lang="ts">
  import { createEventDispatcher } from "svelte";

  // Map view types
  type MapView = "normal" | "hybrid";

  interface Props {
    currentView: MapView;
    showMarkerList: boolean;
  }

  let { currentView, showMarkerList }: Props = $props();

  const dispatch = createEventDispatcher<{
    switchView: MapView;
    zoomToUser: void;
    toggleMarkers: void;
  }>();

  function switchMapView(view: MapView) {
    dispatch('switchView', view);
  }

  function zoomToUserLocation() {
    dispatch('zoomToUser');
  }

  function toggleMarkerList() {
    dispatch('toggleMarkers');
  }
</script>

<div class="view-controls">
  <button
    class="control-button"
    onclick={zoomToUserLocation}
    title="Zoom to my location"
  >
    <svg width="40" height="30">
      <ellipse stroke="#000" ry="10" rx="10" cy="15" cx="20" fill="#fff" />
      <ellipse ry="7" rx="7" cy="15" cx="20" fill="#38c9c9" />
    </svg>
  </button>

  <button
    class="control-button"
    class:active={showMarkerList}
    onclick={toggleMarkerList}
    title="Manage markers"
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  </button>

  <div class="divider"></div>

  <button
    class="view-button-compact"
    class:active={currentView === "normal"}
    onclick={() => switchMapView("normal")}
    title="Normal Map View"
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M3 3h18v18H3z" />
      <path d="M3 9h18M9 3v18" />
    </svg>
    <span>Normal</span>
  </button>

  <button
    class="view-button-compact"
    class:active={currentView === "hybrid"}
    onclick={() => switchMapView("hybrid")}
    title="Satellite Map View"
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 12h18M12 3v18" />
      <circle cx="12" cy="12" r="3" />
    </svg>
    <span>Satellite</span>
  </button>
</div>

<style>
  /* View Controls - Now Horizontal at Top */
  .view-controls {
    position: absolute;
    top: 10px;
    left: 60px; /* Add padding to avoid MapLibre zoom controls */
    right: 10px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    z-index: 1;
    pointer-events: none;
  }

  .view-controls > * {
    pointer-events: auto;
  }

  .control-button {
    display: flex;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    background: white;
    border: 0;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .control-button:hover {
    background: #f5f5f5;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .control-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .control-button.active {
    background: #007cbf;
    color: white;
  }

  .control-button.active svg {
    stroke: white;
  }

  .divider {
    width: 1px;
    height: 24px;
    background: #e0e0e0;
    margin: 0 4px;
  }

  .view-button-compact {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .view-button-compact:hover {
    background: #f5f5f5;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .view-button-compact:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .view-button-compact.active {
    background: #007cbf;
    color: white;
  }

  .view-button-compact.active:hover {
    background: #006aa8;
  }

  .view-button-compact svg {
    flex-shrink: 0;
  }

  .view-button-compact span {
    font-size: 13px;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .view-controls {
      left: 50px; /* Reduce padding on mobile */
    }

    .view-button-compact span {
      display: none;
    }

    .view-button-compact {
      width: 40px;
      padding: 10px;
      justify-content: center;
    }

    .divider {
      display: none;
    }
  }
</style>