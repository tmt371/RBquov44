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

        this._initialize();
        console.log("DetailConfigView Initialized (Passive View).");
    }

    _initialize() {
        const table = document.getElementById('results-table');
        
        table.addEventListener('blur', (event) => {
            if (event.target.matches('.editable-cell-input')) {
                this._handleCellInputBlur(event.target);
            }
        }, true);

        table.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && event.target.matches('.editable-cell-input')) {
                event.preventDefault();
                this._handleCellInputEnter(event.target);
            }
        }, true);
    }

    handleFocusModeRequest({ column }) {
        if (column === 'fabric') {
            this.uiService.setVisibleColumns(['sequence', 'fabricTypeDisplay', 'fabric', 'color']);
            this._updatePanelInputsState(); 
        } else {
            this.uiService.setVisibleColumns(['sequence', column]);
        }
        this.uiService.setActiveCell(0, column);
        this.publish();
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
        }
    }

    handleTableCellInteraction({ rowIndex, column }) {
        if (['location', 'fabric', 'color'].includes(column)) {
            this.uiService.setActiveCell(rowIndex, column);
            this.publish();
            return;
        }

        if (this.propertyOptions[column]) {
            const options = this.propertyOptions[column];
            this.quoteService.cycleItemProperty(rowIndex, column, options);
            this.publish();
            return;
        }
    }

    _handleCellInputBlur(inputElement) {
        const rowIndex = parseInt(inputElement.dataset.rowIndex, 10);
        const column = inputElement.dataset.column;
        const newValue = inputElement.value;

        this.quoteService.updateItemProperty(rowIndex, column, newValue);
        this.uiService.setActiveCell(null, null);
        this.publish();
    }

    _handleCellInputEnter(inputElement) {
        const rowIndex = parseInt(inputElement.dataset.rowIndex, 10);
        const column = inputElement.dataset.column;
        const newValue = inputElement.value;
        const totalRows = this.quoteService.getItems().length;

        this.quoteService.updateItemProperty(rowIndex, column, newValue);

        if (rowIndex < totalRows - 2) {
            this.uiService.setActiveCell(rowIndex + 1, column);
        } else {
            this.uiService.setActiveCell(null, null);
        }
        this.publish();
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
}