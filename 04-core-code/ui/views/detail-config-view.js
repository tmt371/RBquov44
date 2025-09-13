// File: 04-core-code/ui/views/detail-config-view.js

/**
 * @fileoverview View module responsible for all logic related to the Detail Configuration screen.
 */
export class DetailConfigView {
    constructor({ quoteService, uiService, eventAggregator, publishStateChangeCallback }) {
        this.quoteService = quoteService;
        this.uiService = uiService;
        this.eventAggregator = eventAggregator;
        this.publish = publishStateChangeCallback;

        this.propertyOptions = {
            over: ['', 'O'],
            oi: ['', 'IN', 'OUT'],
            lr: ['', 'L', 'R']
        };

        this.locationButton = document.getElementById('btn-focus-location');
        this.locationInput = document.getElementById('location-input-box');
        this.fabricColorButton = document.getElementById('btn-focus-fabric'); // [NEW] Reference to the other button

        this._initialize();
        console.log("DetailConfigView Initialized (Corrected Passive View).");
    }

    _initialize() {
        this.eventAggregator.subscribe('stateChanged', (state) => this._onStateChanged(state));
    }

    _onStateChanged(state) {
        if (state.ui.currentView !== 'DETAIL_CONFIG') return;

        const { isLocationEditMode, locationInputValue } = state.ui;

        if (this.locationInput) {
            this.locationInput.disabled = !isLocationEditMode;
            this.locationInput.classList.toggle('active', isLocationEditMode);
            if (this.locationInput.value !== locationInputValue) {
                this.locationInput.value = locationInputValue;
            }
        }
        
        if (this.locationButton) {
            this.locationButton.classList.toggle('active', isLocationEditMode);
        }

        // --- [NEW] Manage button disabled state based on mode ---
        if (this.fabricColorButton) {
            this.fabricColorButton.classList.toggle('disabled-by-mode', isLocationEditMode);
            this.fabricColorButton.disabled = isLocationEditMode;
        }
    }

    handleFocusModeRequest({ column }) {
        if (column === 'location') {
            this._toggleLocationEditMode();
            return;
        }

        if (column === 'fabric') {
            this._resyncFabricAndColorData();
            this.uiService.setVisibleColumns(['sequence', 'fabricTypeDisplay', 'fabric', 'color']);
            this._updatePanelInputsState(); 
            this.uiService.setActiveCell(null, null);
        } else {
            this.uiService.setVisibleColumns(['sequence', column]);
        }
        this.publish();
    }
    
    _toggleLocationEditMode() {
        const isCurrentlyEditing = this.uiService.getState().isLocationEditMode;
        const newEditState = !isCurrentlyEditing;

        this.uiService.setIsLocationEditMode(newEditState);

        if (newEditState) {
            this.uiService.setVisibleColumns(['sequence', 'fabricTypeDisplay', 'location']);
            const targetRow = 0;
            this.uiService.setTargetCell({ rowIndex: targetRow, column: 'location' });
            
            // [FIX] Load existing data of the target cell into the input box
            const currentItem = this.quoteService.getItems()[targetRow];
            this.uiService.setLocationInputValue(currentItem.location || '');
            
            setTimeout(() => {
                this.locationInput.focus();
                this.locationInput.select();
            }, 0);
        } else {
            this.uiService.setTargetCell(null);
            this.uiService.setLocationInputValue('');
        }
        this.publish();
    }

    handleLocationInputEnter({ value }) {
        const { targetCell } = this.uiService.getState();
        if (!targetCell) return;

        this.quoteService.updateItemProperty(targetCell.rowIndex, targetCell.column, value);

        const nextRowIndex = targetCell.rowIndex + 1;
        const totalRows = this.quoteService.getItems().length;

        if (nextRowIndex < totalRows - 1) {
            this.uiService.setTargetCell({ rowIndex: nextRowIndex, column: 'location' });
            const nextItem = this.quoteService.getItems()[nextRowIndex];
            this.uiService.setLocationInputValue(nextItem.location || '');
            this.publish();
            setTimeout(() => this.locationInput.select(), 0);
        } else {
            this._toggleLocationEditMode(); // Auto-exit after the last item
        }
    }


    handleBatchUpdateRequest({ column, value }) {
        this.quoteService.batchUpdateProperty(column, value);
        this.publish();
    }

    handlePanelInputEnter({ type, field }) {
        const inputElement = document.querySelector(`.panel-input[data-type="${type}"][data-field="${field}"]`);
        if (inputElement) {
            this.quoteService.batchUpdatePropertyByType(type, field, inputElement.value);
            this.publish();
        }

        const inputs = Array.from(document.querySelectorAll('.panel-input:not([disabled])'));
        const currentIndex = inputs.indexOf(inputElement);
        const nextInput = inputs[currentIndex + 1];

        if (nextInput) {
            nextInput.focus();
        } else {
            inputElement.blur();
        }
    }

    handleSequenceCellClick({ rowIndex }) {
        const { isLocationEditMode } = this.uiService.getState();
        if (isLocationEditMode) {
            this.uiService.setTargetCell({ rowIndex, column: 'location' });
            const item = this.quoteService.getItems()[rowIndex];
            this.uiService.setLocationInputValue(item.location || '');
            this.publish();
            setTimeout(() => {
                this.locationInput.focus();
                this.locationInput.select();
            }, 0);
        }
    }

    handleTableCellInteraction({ rowIndex, column }) {
        if (this.propertyOptions[column]) {
            this.uiService.setActiveCell(rowIndex, column);
            const options = this.propertyOptions[column];
            this.quoteService.cycleItemProperty(rowIndex, column, options);
            this.publish();
            setTimeout(() => {
                this.uiService.setActiveCell(null, null);
                this.publish();
            }, 100);
            return;
        }
    }

    _updatePanelInputsState() {
        const items = this.quoteService.getItems();
        const presentTypes = new Set(items.map(item => item.fabricType).filter(Boolean));
        
        const allPanelInputs = document.querySelectorAll('.panel-input');
        allPanelInputs.forEach(input => {
            if (input.dataset.type !== 'LF') {
                input.disabled = !presentTypes.has(input.dataset.type);
            }
        });

        const firstEnabledInput = document.querySelector('.panel-input:not([disabled])');
        if (firstEnabledInput) {
            setTimeout(() => firstEnabledInput.focus(), 0);
        }
    }

    _resyncFabricAndColorData() {
        const enabledInputs = document.querySelectorAll('.panel-input:not([disabled])');
        enabledInputs.forEach(input => {
            const type = input.dataset.type;
            const field = input.dataset.field;
            const value = input.value;
            if (value) {
                this.quoteService.batchUpdatePropertyByType(type, field, value);
            }
        });
        this.publish();
    }
}