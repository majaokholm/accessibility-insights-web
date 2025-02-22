// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { NeedsReviewCardSelectionActionCreator } from 'background/actions/needs-review-card-selection-action-creator';
import { NeedsReviewScanResultActionCreator } from 'background/actions/needs-review-scan-result-action-creator';
import { TabStopRequirementActionCreator } from 'background/actions/tab-stop-requirement-action-creator';
import { BrowserAdapter } from 'common/browser-adapters/browser-adapter';
import { VisualizationConfigurationFactory } from 'common/configs/visualization-configuration-factory';
import { Logger } from 'common/logging/logger';
import { NotificationCreator } from 'common/notification-creator';
import { PromiseFactory } from 'common/promises/promise-factory';
import { StateDispatcher } from 'common/state-dispatcher';
import { WindowUtils } from 'common/window-utils';
import { ActionCreator } from './actions/action-creator';
import { ActionHub } from './actions/action-hub';
import { CardSelectionActionCreator } from './actions/card-selection-action-creator';
import { ContentActionCreator } from './actions/content-action-creator';
import { DetailsViewActionCreator } from './actions/details-view-action-creator';
import { DevToolsActionCreator } from './actions/dev-tools-action-creator';
import { InjectionActionCreator } from './actions/injection-action-creator';
import { InspectActionCreator } from './actions/inspect-action-creator';
import { PathSnippetActionCreator } from './actions/path-snippet-action-creator';
import { PopupActionCreator } from './actions/popup-action-creator';
import { ShortcutsPageActionCreator } from './actions/shortcuts-page-action-creator';
import { TabActionCreator } from './actions/tab-action-creator';
import { UnifiedScanResultActionCreator } from './actions/unified-scan-result-action-creator';
import { ExtensionDetailsViewController } from './extension-details-view-controller';
import { InjectorController } from './injector-controller';
import { ContentScriptInjector } from './injector/content-script-injector';
import { Interpreter } from './interpreter';
import { ShortcutsPageController } from './shortcuts-page-controller';
import { TabContextStoreHub } from './stores/tab-context-store-hub';
import { TabContext } from './tab-context';
import { TargetTabController } from './target-tab-controller';
import { TelemetryEventHandler } from './telemetry/telemetry-event-handler';
import { UsageLogger } from './usage-logger';

export class TabContextFactory {
    constructor(
        private visualizationConfigurationFactory: VisualizationConfigurationFactory,
        private telemetryEventHandler: TelemetryEventHandler,
        private targetTabController: TargetTabController,
        private notificationCreator: NotificationCreator,
        private readonly promiseFactory: PromiseFactory,
        private readonly logger: Logger,
        private readonly usageLogger: UsageLogger,
        private readonly windowUtils: WindowUtils,
    ) {}

    public createTabContext(
        broadcastMessage: (message) => Promise<void>,
        browserAdapter: BrowserAdapter,
        detailsViewController: ExtensionDetailsViewController,
    ): TabContext {
        const interpreter = new Interpreter();
        const actionsHub = new ActionHub();
        const storeHub = new TabContextStoreHub(actionsHub, this.visualizationConfigurationFactory);
        const notificationCreator = new NotificationCreator(
            browserAdapter,
            this.visualizationConfigurationFactory,
            this.logger,
        );
        const shortcutsPageController = new ShortcutsPageController(browserAdapter);

        const shortcutsPageActionCreator = new ShortcutsPageActionCreator(
            interpreter,
            shortcutsPageController,
            this.telemetryEventHandler,
            this.logger,
        );

        const actionCreator = new ActionCreator(
            interpreter,
            actionsHub,
            detailsViewController,
            this.telemetryEventHandler,
            notificationCreator,
            this.visualizationConfigurationFactory,
            this.targetTabController,
            this.logger,
        );

        const detailsViewActionCreator = new DetailsViewActionCreator(
            interpreter,
            actionsHub.detailsViewActions,
            actionsHub.sidePanelActions,
            detailsViewController,
            this.telemetryEventHandler,
        );

        const tabStopRequirementActionCreator = new TabStopRequirementActionCreator(
            interpreter,
            actionsHub.tabStopRequirementActions,
            this.telemetryEventHandler,
        );

        const tabActionCreator = new TabActionCreator(
            interpreter,
            actionsHub.tabActions,
            browserAdapter,
            this.telemetryEventHandler,
            this.logger,
        );
        const popupActionCreator = new PopupActionCreator(
            interpreter,
            actionsHub.tabActions,
            this.telemetryEventHandler,
            this.usageLogger,
        );
        const devToolsActionCreator = new DevToolsActionCreator(
            interpreter,
            actionsHub.devToolActions,
            this.telemetryEventHandler,
        );
        const inspectActionsCreator = new InspectActionCreator(
            interpreter,
            actionsHub.inspectActions,
            this.telemetryEventHandler,
            browserAdapter,
            this.logger,
        );
        const pathSnippetActionCreator = new PathSnippetActionCreator(
            interpreter,
            actionsHub.pathSnippetActions,
        );
        const unifiedScanResultActionCreator = new UnifiedScanResultActionCreator(
            interpreter,
            actionsHub.unifiedScanResultActions,
            this.telemetryEventHandler,
            this.notificationCreator,
        );
        const needsReviewScanResultActionCreator = new NeedsReviewScanResultActionCreator(
            interpreter,
            actionsHub.needsReviewScanResultActions,
            this.telemetryEventHandler,
            this.notificationCreator,
        );
        const contentActionCreator = new ContentActionCreator(
            interpreter,
            actionsHub.contentActions,
            this.telemetryEventHandler,
            detailsViewController,
        );
        const cardSelectionActionCreator = new CardSelectionActionCreator(
            interpreter,
            actionsHub.cardSelectionActions,
            this.telemetryEventHandler,
        );
        const needsReviewCardSelectionActionCreator = new NeedsReviewCardSelectionActionCreator(
            interpreter,
            actionsHub.needsReviewCardSelectionActions,
            this.telemetryEventHandler,
        );
        const injectionActionCreator = new InjectionActionCreator(
            interpreter,
            actionsHub.injectionActions,
        );

        const injectorController = new InjectorController(
            new ContentScriptInjector(browserAdapter, this.promiseFactory, this.logger),
            storeHub.visualizationStore,
            interpreter,
            storeHub.tabStore,
            storeHub.inspectStore,
            this.windowUtils,
            this.logger,
        );

        shortcutsPageActionCreator.registerCallbacks();
        actionCreator.registerCallbacks();
        detailsViewActionCreator.registerCallback();
        devToolsActionCreator.registerCallbacks();
        inspectActionsCreator.registerCallbacks();
        pathSnippetActionCreator.registerCallbacks();
        tabActionCreator.registerCallbacks();
        tabStopRequirementActionCreator.registerCallbacks();
        popupActionCreator.registerCallbacks();
        contentActionCreator.registerCallbacks();
        needsReviewScanResultActionCreator.registerCallbacks();
        needsReviewCardSelectionActionCreator.registerCallbacks();
        unifiedScanResultActionCreator.registerCallbacks();
        cardSelectionActionCreator.registerCallbacks();
        injectionActionCreator.registerCallbacks();

        injectorController.initialize();
        const dispatcher = new StateDispatcher(broadcastMessage, storeHub, this.logger);
        dispatcher.initialize();

        return new TabContext(interpreter, storeHub);
    }
}
