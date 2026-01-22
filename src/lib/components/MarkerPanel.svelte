<script lang="ts">
  import { createEventDispatcher } from "svelte";

  // Custom marker type
  type CustomMarker = {
    id: string;
    title: string;
    lat: number;
    lon: number;
    angle: number;
    type: "direction" | "point";
  };

  interface Props {
    customMarkers: CustomMarker[];
    isPickingFromMap: boolean;
    editingMarkerId: string | null;
    isAddingNew: boolean;
    showMarkerList: boolean;
    editForm: {
      title: string;
      lat: string;
      lon: string;
      angle: string;
      type: "direction" | "point";
    };
  }

  let {
    customMarkers,
    isPickingFromMap,
    editingMarkerId,
    isAddingNew,
    showMarkerList,
    editForm
  }: Props = $props();

  const dispatch = createEventDispatcher<{
    startAddingMarker: void;
    cancelEdit: void;
    saveMarker: void;
    startEditingMarker: CustomMarker;
    removeMarker: string;
    zoomToMarker: CustomMarker;
    togglePicking: void;
    updateEditForm: Partial<Props['editForm']>;
  }>();

  function startAddingMarker() {
    dispatch('startAddingMarker');
  }

  function cancelEdit() {
    dispatch('cancelEdit');
  }

  function saveMarker() {
    dispatch('saveMarker');
  }

  function startEditingMarker(marker: CustomMarker) {
    dispatch('startEditingMarker', marker);
  }

  function removeMarker(markerId: string) {
    dispatch('removeMarker', markerId);
  }

  function zoomToMarker(marker: CustomMarker) {
    dispatch('zoomToMarker', marker);
  }

  function togglePicking() {
    dispatch('togglePicking');
  }

  function updateEditForm(updates: Partial<Props['editForm']>) {
    dispatch('updateEditForm', updates);
  }
</script>

{#if showMarkerList}
  <div class="marker-panel">
    <div class="panel-header">
      <h3>Markers ({customMarkers.length})</h3>
      <button class="btn-add" onclick={startAddingMarker}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add Marker
      </button>
    </div>

    <div class="marker-list">
      <!-- Add New Marker Form -->
      {#if isAddingNew}
        <div class="marker-item editing">
          <div class="edit-form">
            <!-- Marker Type Selector -->
            <div class="form-row type-selector">
              <button
                class="type-button"
                class:active={editForm.type === "point"}
                onclick={() => updateEditForm({ type: "point" })}
                type="button"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Point Marker
              </button>
              <button
                class="type-button"
                class:active={editForm.type === "direction"}
                onclick={() => updateEditForm({ type: "direction" })}
                type="button"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                  <path d="M12 2v8m0 0l3-3m-3 3l-3-3" />
                </svg>
                Direction Marker
              </button>
            </div>

            <div class="form-row">
              <input
                type="text"
                bind:value={editForm.title}
                placeholder="Marker title"
                class="input-title"
              />
            </div>
            <div class="form-row-with-button">
              <div class="coord-inputs">
                <input
                  type="number"
                  step="any"
                  bind:value={editForm.lat}
                  placeholder="Latitude"
                  class="input-coord"
                />
                <input
                  type="number"
                  step="any"
                  bind:value={editForm.lon}
                  placeholder="Longitude"
                  class="input-coord"
                />
              </div>
              <button
                class="btn-pick-map"
                class:active={isPickingFromMap}
                onclick={togglePicking}
                title="Pick from map"
                type="button"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </button>
              {#if editForm.type === "direction"}
                <input
                  type="number"
                  step="any"
                  bind:value={editForm.angle}
                  placeholder="Angle"
                  class="input-angle"
                />
              {/if}
            </div>
            <div class="form-actions">
              <button
                class="btn-cancel-inline"
                onclick={cancelEdit}
                type="button">Cancel</button
              >
              <button
                class="btn-save-inline"
                onclick={saveMarker}
                type="button">Save</button
              >
            </div>
          </div>
        </div>
      {/if}

      {#if customMarkers.length === 0 && !isAddingNew}
        <div class="empty-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p>No markers yet</p>
          <p class="hint">Click "Add Marker" to create one</p>
        </div>
      {:else}
        {#each customMarkers as marker (marker.id)}
          <div
            class="marker-item"
            class:editing={editingMarkerId === marker.id}
          >
            {#if editingMarkerId === marker.id}
              <!-- Edit Mode -->
              <div class="edit-form">
                <!-- Marker Type Selector -->
                <div class="form-row type-selector">
                  <button
                    class="type-button"
                    class:active={editForm.type === "point"}
                    onclick={() => updateEditForm({ type: "point" })}
                    type="button"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                      />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Point
                  </button>
                  <button
                    class="type-button"
                    class:active={editForm.type === "direction"}
                    onclick={() => updateEditForm({ type: "direction" })}
                    type="button"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                      />
                      <circle cx="12" cy="10" r="3" />
                      <path d="M12 2v8m0 0l3-3m-3 3l-3-3" />
                    </svg>
                    Direction
                  </button>
                </div>

                <div class="form-row">
                  <input
                    type="text"
                    bind:value={editForm.title}
                    placeholder="Marker title"
                    class="input-title"
                  />
                </div>
                <div class="form-row-with-button">
                  <div class="coord-inputs">
                    <input
                      type="number"
                      step="any"
                      bind:value={editForm.lat}
                      placeholder="Latitude"
                      class="input-coord"
                    />
                    <input
                      type="number"
                      step="any"
                      bind:value={editForm.lon}
                      placeholder="Longitude"
                      class="input-coord"
                    />
                  </div>
                  <button
                    class="btn-pick-map"
                    class:active={isPickingFromMap}
                    onclick={togglePicking}
                    title="Pick from map"
                    type="button"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                      />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </button>
                  {#if editForm.type === "direction"}
                    <input
                      type="number"
                      step="any"
                      bind:value={editForm.angle}
                      placeholder="Angle"
                      class="input-angle"
                    />
                  {/if}
                </div>
                <div class="form-actions">
                  <button
                    class="btn-cancel-inline"
                    onclick={cancelEdit}
                    type="button">Cancel</button
                  >
                  <button
                    class="btn-save-inline"
                    onclick={saveMarker}
                    type="button">Save</button
                  >
                </div>
              </div>
            {:else}
              <!-- View Mode -->
              <button
                class="marker-info"
                onclick={() => zoomToMarker(marker)}
              >
                <div class="marker-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill={marker.type === "point" ? "#4CAF50" : "#ff6b6b"}
                    stroke="white"
                    stroke-width="2"
                  >
                    <path
                      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                    />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div class="marker-details">
                  <div class="marker-title">{marker.title}</div>
                  <div class="marker-coords">
                    {#if marker.type === "point"}
                      📍 Lat: {marker.lat.toFixed(6)}, Lon: {marker.lon.toFixed(
                        6
                      )}
                    {:else}
                      {marker.lat.toFixed(5)}, {marker.lon.toFixed(5)} • {marker.angle}°
                    {/if}
                  </div>
                </div>
              </button>
              <div class="marker-actions">
                <button
                  class="btn-icon"
                  onclick={() => startEditingMarker(marker)}
                  title="Edit marker"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    />
                    <path
                      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    />
                  </svg>
                </button>
                <button
                  class="btn-icon btn-delete"
                  onclick={() => removeMarker(marker.id)}
                  title="Delete marker"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    />
                  </svg>
                </button>
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Marker Panel */
  .marker-panel {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    max-height: 60vh;
    display: flex;
    flex-direction: column;
    z-index: 10;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e0e0e0;
  }

  .panel-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  .btn-add {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: #007cbf;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-add:hover {
    background: #006aa8;
  }

  .marker-list {
    overflow-y: auto;
    padding: 12px;
    flex-grow: 1;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #999;
    text-align: center;
  }

  .empty-state svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state p {
    margin: 4px 0;
  }

  .empty-state .hint {
    font-size: 13px;
    color: #bbb;
  }

  .marker-item {
    display: flex;
    align-items: center;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 8px;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .marker-item:not(.editing):hover {
    background: #f0f0f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .marker-item.editing {
    background: #e3f2fd;
    padding: 12px;
    flex-direction: column;
    align-items: stretch;
  }

  .marker-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    flex-grow: 1;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .marker-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 8px;
    flex-shrink: 0;
  }

  .marker-details {
    flex-grow: 1;
    min-width: 0;
  }

  .marker-title {
    font-weight: 600;
    color: #333;
    font-size: 14px;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .marker-coords {
    font-size: 12px;
    color: #666;
  }

  .marker-actions {
    display: flex;
    gap: 4px;
    padding: 0 8px;
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #666;
  }

  .btn-icon:hover {
    background: #e0e0e0;
    color: #333;
  }

  .btn-icon.btn-delete:hover {
    background: #ffebee;
    color: #c62828;
  }

  /* Inline Edit Form */
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .type-selector {
    display: flex;
    gap: 8px;
  }

  .type-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 12px;
    background: white;
    border: 2px solid #ccc;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .type-button:hover {
    background: #f5f5f5;
    border-color: #999;
  }

  .type-button.active {
    background: #e3f2fd;
    border-color: #007cbf;
    color: #007cbf;
  }

  .type-button.active svg {
    stroke: #007cbf;
  }

  .form-row {
    display: flex;
    gap: 8px;
  }

  .form-row-with-button {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .coord-inputs {
    display: flex;
    gap: 8px;
    flex: 1;
  }

  .edit-form input {
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    background: white;
  }

  .edit-form input:focus {
    outline: none;
    border-color: #007cbf;
    box-shadow: 0 0 0 3px rgba(0, 124, 191, 0.1);
  }

  .input-title {
    flex-grow: 1;
  }

  .input-coord {
    flex: 1;
    min-width: 0;
  }

  .input-angle {
    width: 80px;
    flex-shrink: 0;
  }

  .btn-pick-map {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 36px;
    background: white;
    border: 2px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .btn-pick-map:hover {
    background: #f5f5f5;
    border-color: #007cbf;
  }

  .btn-pick-map.active {
    background: #4caf50;
    border-color: #4caf50;
  }

  .btn-pick-map.active svg {
    stroke: white;
  }

  .form-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .btn-cancel-inline,
  .btn-save-inline {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-cancel-inline {
    background: white;
    color: #666;
    border: 1px solid #ccc;
  }

  .btn-cancel-inline:hover {
    background: #f5f5f5;
  }

  .btn-save-inline {
    background: #007cbf;
    color: white;
  }

  .btn-save-inline:hover {
    background: #006aa8;
  }
</style>