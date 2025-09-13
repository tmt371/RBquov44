// File: 04-core-code/app-controller.js

import { initialState } from './config/initial-state.js';
import { DetailConfigView } from './ui/views/detail-config-view.js';

const AUTOSAVE_STORAGE_KEY = 'quoteAutoSaveData';
const AUTOSAVE_INTERVAL_MS = 60000;

export class AppController {
    constructor({ eventAggregator, uiService, quoteService, fileService, quickQuoteView, detailConfigView }) {
        this.eventAggregator = eventAggregator;
        this.uiService = uiService;
        this.quoteService = quoteService;
        this.fileService = fileService;
        
        this.quickQuoteView = quickQuoteView;
        this.detailConfigView = detailConfigView;

        this.autoSaveTimerId = null;
        console.log("AppController (Refactored as View Manager) Initialized.");
        this.initialize();
    }

    initialize() {
        const delegateToView = (handlerName, requiresInitialState = false) => (data) => {
            const currentView = this.uiService.getState().currentView;

            // --- [NEW DIAGNOSTIC LOG] ---
            console.log(
                `[AppController] Event received, attempting to delegate '${handlerName}'. currentView is: %c'${currentView}'`,
                'color: blue; font-weight: bold;',
                '| Data:', data || 'None'
            );

            if (currentView === 'QUICK_QUOTE' && this.quickQuoteView && typeof this.quickQuoteView[handlerName] === 'function') {
                const args = requiresInitialState ? [initialState.ui] : [data];
                this.quickQuoteView[handlerName](...args);
            } else if (currentView === 'DETAIL_CONFIG' && this.detailConfigView && typeof this.detailConfigView[handlerName] === 'function') {
                this.detailConfigView[handlerName](data);
            } else {
                console.warn(`[AppController] Event '${handlerName}' was not handled by any active view.`);
            }
        };

        this.eventAggregator.subscribe('numericKeyPressed', delegateToView('handleNumericKeyPress'));
        this.eventAggregator.subscribe('tableCellClicked', delegateToView('handleTableCellClick'));
        this.eventAggregator.subscribe('sequenceCellClicked', delegateToView('handleSequenceCellClick'));
        this.eventAggregator.subscribe('userRequestedInsertRow', delegateToView('handleInsertRow'));
        this.eventAggregator.subscribe('userRequestedDeleteRow', delegateToView('handleDeleteRow'));
        this.eventAggregator.subscribe('userRequestedSave', delegateToView('handleSaveToFile'));
        this.eventAggregator.subscribe('userRequestedExportCSV', delegateToView('handleExportCSV'));
        this.eventAggregator.subscribe('userRequestedReset', delegateToView('handleReset', true));
        this.eventAggregator.subscribe('userRequestedClearRow', delegateToView('handleClearRow'));
        this.eventAggregator.subscribe('userMovedActiveCell', delegateToView('handleMoveActiveCell'));
        this.eventAggregator.subscribe('userRequestedCycleType', delegateToView('handleCycleType'));
        this.eventAggregator.subscribe('userRequestedCalculateAndSum', delegateToView('handleCalculateAndSum'));
        this.eventAggregator.subscribe('userRequestedMultiDeleteMode', delegateToView('handleToggleMultiDeleteMode'));
        this.eventAggregator.subscribe('userChoseSaveThenLoad', delegateToView('handleSaveThenLoad'));

        this.eventAggregator.subscribe('userNavigatedToDetailView', () => this._handleNavigationToDetailView());
        this.eventAggregator.subscribe('userRequestedLoad', () => this._handleUserRequestedLoad());
        this.eventAggregator.subscribe('userChoseLoadDirectly', () => this._handleLoadDirectly());
        this.eventAggregator.subscribe('fileLoaded', (data) => this._handleFileLoad(data));
        
        this._startAutoSave();
    }
    
    _handleNavigationToDetailView() {
        const currentView = this.uiService.getState().currentView;
        if (currentView === 'QUICK_QUOTE') {
            this.uiService.setCurrentView('DETAIL_CONFIG');
        } else {
            this.uiService.setCurrentView('QUICK_QUOTE');
        }
        this._publishStateChange();
    }

    _handleUserRequestedLoad() {
        if (this.quoteService.hasData()) {
            this.eventAggregator.publish('showLoadConfirmationDialog');
        } else {
            this.eventAggregator.publish('triggerFileLoad');
        }
    }

    _handleLoadDirectly() {
        this.eventAggregator.publish('triggerFileLoad');
    }

    _handleFileLoad({ fileName, content }) {
        const result = this.fileService.parseFileContent(fileName, content);
        if (result.success) {
            this.quoteData = result.data;
            this.uiService.reset(initialState.ui);
            this.uiService.setSumOutdated(true);
            this._publishStateChange();
            this.eventAggregator.publish('showNotification', { message: result.message });
        } else {
            this.eventAggregator.publish('showNotification', { message: result.message, type: 'error' });
        }
    }
    
    _getFullState() {
        return {
            ui: this.uiService.getState(),
            quoteData: this.quoteService.getQuoteData()
        };
    }
    
    publishInitialState() { this._publishStateChange(); }
    _publishStateChange() {
        this.eventAggregator.publish('stateChanged', this._getFullState());
    }

    _startAutoSave() {
        if (this.autoSaveTimerId) { clearInterval(this.autoSaveTimerId); }
        this.autoSaveTimerId = setInterval(() => this._handleAutoSave(), AUTOSAVE_INTERVAL_MS);
    }

    _handleAutoSave() {
        try {
            const items = this.quoteService.getItems();
            const hasContent = items.length > 1 || (items.length === 1 && (items[0].width || items[0].height));
            if (hasContent) {
                const dataToSave = JSON.stringify(this.quoteService.getQuoteData());
                localStorage.setItem(AUTOSAVE_STORAGE_KEY, dataToSave);
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }
}