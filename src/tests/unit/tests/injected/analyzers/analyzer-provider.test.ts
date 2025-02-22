// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { FeatureFlagStore } from 'background/stores/global/feature-flag-store';
import { ScopingStore } from 'background/stores/global/scoping-store';
import { TabStopEvent } from 'common/types/tab-stop-event';
import { AllFrameRunner } from 'injected/all-frame-runner';
import { TabStopsDoneAnalyzingTracker } from 'injected/analyzers/tab-stops-done-analyzing-tracker';
import { TabStopsRequirementResultProcessor } from 'injected/analyzers/tab-stops-requirement-result-processor';
import { ScanIncompleteWarningDetector } from 'injected/scan-incomplete-warning-detector';
import { failTestOnErrorLogger } from 'tests/unit/common/fail-test-on-error-logger';
import { IMock, Mock } from 'typemoq';
import { TelemetryDataFactory } from '../../../../../common/telemetry-data-factory';
import { VisualizationType } from '../../../../../common/types/visualization-type';
import {
    AnalyzerConfiguration,
    FocusAnalyzerConfiguration,
    RuleAnalyzerConfiguration,
} from '../../../../../injected/analyzers/analyzer';
import { AnalyzerProvider } from '../../../../../injected/analyzers/analyzer-provider';
import { BaseAnalyzer } from '../../../../../injected/analyzers/base-analyzer';
import {
    BatchedRuleAnalyzer,
    IResultRuleFilter,
} from '../../../../../injected/analyzers/batched-rule-analyzer';
import { PostResolveCallback, RuleAnalyzer } from '../../../../../injected/analyzers/rule-analyzer';
import { ScannerUtils } from '../../../../../injected/scanner-utils';

describe('AnalyzerProviderTests', () => {
    let tabStopsListener: IMock<AllFrameRunner<TabStopEvent>>;
    let scopingStoreMock: IMock<ScopingStore>;
    let telemetryFactoryMock: IMock<TelemetryDataFactory>;
    let sendMessageMock: IMock<(message) => void>;
    let testObject: AnalyzerProvider;
    let scannerMock: IMock<ScannerUtils>;
    let dateGetterMock: IMock<() => Date>;
    let typeStub: VisualizationType;
    let keyStub: string;
    let analyzerMessageTypeStub: string;
    let filterResultsByRulesMock: IMock<IResultRuleFilter>;
    let sendConvertedResultsMock: IMock<PostResolveCallback>;
    let sendNeedsReviewResultsMock: IMock<PostResolveCallback>;
    let scanIncompleteWarningDetectorMock: IMock<ScanIncompleteWarningDetector>;
    let tabStopsDoneAnalyzingTrackerMock: IMock<TabStopsDoneAnalyzingTracker>;
    let tabStopsRequirementResultProcessorMock: IMock<TabStopsRequirementResultProcessor>;
    let featureFlagStoreMock: IMock<FeatureFlagStore>;

    beforeEach(() => {
        typeStub = -1;
        keyStub = 'test key';
        analyzerMessageTypeStub = 'analyzer message stub';

        sendMessageMock = Mock.ofInstance(message => {});
        dateGetterMock = Mock.ofInstance(() => null);
        tabStopsListener = Mock.ofInstance({} as AllFrameRunner<TabStopEvent>);
        scopingStoreMock = Mock.ofType(ScopingStore);
        telemetryFactoryMock = Mock.ofType(TelemetryDataFactory);
        scannerMock = Mock.ofType(ScannerUtils);
        filterResultsByRulesMock = Mock.ofInstance(() => null);
        sendConvertedResultsMock = Mock.ofInstance(() => null);
        sendNeedsReviewResultsMock = Mock.ofInstance(() => null);
        scanIncompleteWarningDetectorMock = Mock.ofType<ScanIncompleteWarningDetector>();
        tabStopsDoneAnalyzingTrackerMock = Mock.ofType<TabStopsDoneAnalyzingTracker>();
        tabStopsRequirementResultProcessorMock = Mock.ofType<TabStopsRequirementResultProcessor>();
        featureFlagStoreMock = Mock.ofType<FeatureFlagStore>();

        testObject = new AnalyzerProvider(
            tabStopsListener.object,
            tabStopsDoneAnalyzingTrackerMock.object,
            tabStopsRequirementResultProcessorMock.object,
            featureFlagStoreMock.object,
            scopingStoreMock.object,
            sendMessageMock.object,
            scannerMock.object,
            telemetryFactoryMock.object,
            dateGetterMock.object,
            filterResultsByRulesMock.object,
            sendConvertedResultsMock.object,
            sendNeedsReviewResultsMock.object,
            scanIncompleteWarningDetectorMock.object,
            failTestOnErrorLogger,
        );
    });

    test('createRuleAnalyzer', () => {
        const config: RuleAnalyzerConfiguration = {
            testType: typeStub,
            analyzerMessageType: analyzerMessageTypeStub,
            key: keyStub,
            rules: ['test rule'],
            resultProcessor: null,
            telemetryProcessor: null,
        };
        const analyzer = testObject.createRuleAnalyzer(config);
        expect(analyzer).toBeInstanceOf(RuleAnalyzer);
        validateRuleAnalyzer(analyzer, config);
        expect((analyzer as any).postOnResolve).toEqual(null);
    });

    test('createRuleAnalyzerUnifiedScan', () => {
        const config: RuleAnalyzerConfiguration = {
            testType: typeStub,
            analyzerMessageType: analyzerMessageTypeStub,
            key: keyStub,
            rules: ['test rule'],
            resultProcessor: null,
            telemetryProcessor: null,
        };
        const analyzer = testObject.createRuleAnalyzerUnifiedScan(config);
        expect(analyzer).toBeInstanceOf(RuleAnalyzer);
        validateRuleAnalyzer(analyzer, config);
        expect((analyzer as any).postOnResolve).toEqual(sendConvertedResultsMock.object);
    });

    test('createRuleAnalyzerUnifiedScanForNeedsReview', () => {
        const config: RuleAnalyzerConfiguration = {
            testType: typeStub,
            analyzerMessageType: analyzerMessageTypeStub,
            key: keyStub,
            rules: ['test rule'],
            resultProcessor: null,
            telemetryProcessor: null,
        };
        const analyzer = testObject.createRuleAnalyzerUnifiedScanForNeedsReview(config);
        expect(analyzer).toBeInstanceOf(RuleAnalyzer);
        validateRuleAnalyzer(analyzer, config);
        expect((analyzer as any).postOnResolve).toEqual(sendNeedsReviewResultsMock.object);
    });

    test('createBatchedRuleAnalyzer', () => {
        const config: RuleAnalyzerConfiguration = {
            testType: typeStub,
            analyzerMessageType: analyzerMessageTypeStub,
            key: keyStub,
            rules: ['test rule'],
            resultProcessor: null,
            telemetryProcessor: null,
        };
        const analyzer = testObject.createBatchedRuleAnalyzer(config);
        const openAnalyzer = analyzer as any;
        expect(analyzer).toBeInstanceOf(BatchedRuleAnalyzer);
        validateRuleAnalyzer(analyzer, config);
        expect(openAnalyzer.postScanFilter).toEqual(filterResultsByRulesMock.object);
    });

    test('createFocusTrackingAnalyzer', () => {
        const config: FocusAnalyzerConfiguration = {
            testType: typeStub,
            analyzerMessageType: analyzerMessageTypeStub,
            key: keyStub,
            analyzerProgressMessageType: 'analyzer progress message',
            analyzerTerminatedMessageType: 'analyzer terminated message',
        };

        const analyzer = testObject.createFocusTrackingAnalyzer(config);
        const openAnalyzer = analyzer as any;
        expect(analyzer).toBeInstanceOf(BaseAnalyzer);
        expect(openAnalyzer.tabStopsRequirementResultProcessor).toBeNull();
        validateFocusTrackingAnalyzer(openAnalyzer, config);
    });

    test('createTabStopsAnalyzer', () => {
        const config: FocusAnalyzerConfiguration = {
            testType: typeStub,
            analyzerMessageType: analyzerMessageTypeStub,
            key: keyStub,
            analyzerProgressMessageType: 'analyzer progress message',
            analyzerTerminatedMessageType: 'analyzer terminated message',
        };

        const analyzer = testObject.createTabStopsAnalyzer(config);
        const openAnalyzer = analyzer as any;
        expect(analyzer).toBeInstanceOf(BaseAnalyzer);
        expect(openAnalyzer.tabStopsRequirementResultProcessor).toEqual(
            tabStopsRequirementResultProcessorMock.object,
        );
        validateFocusTrackingAnalyzer(openAnalyzer, config);
    });

    test('createBaseAnalyzer', () => {
        const config: AnalyzerConfiguration = {
            testType: typeStub,
            analyzerMessageType: analyzerMessageTypeStub,
            key: keyStub,
        };

        const analyzer = testObject.createBaseAnalyzer(config);
        const openAnalyzer = analyzer as any;
        expect(analyzer).toBeInstanceOf(BaseAnalyzer);
        expect(openAnalyzer.config).toEqual(config);
        expect(openAnalyzer.sendMessage).toEqual(sendMessageMock.object);
    });

    function validateRuleAnalyzer(openAnalyzer, config): void {
        expect(openAnalyzer.scanner).toEqual(scannerMock.object);
        expect(openAnalyzer.scopingStore).toEqual(scopingStoreMock.object);
        expect(openAnalyzer.dateGetter).toEqual(dateGetterMock.object);
        expect(openAnalyzer.telemetryFactory).toEqual(telemetryFactoryMock.object);
        expect(openAnalyzer.config).toEqual(config);
        expect(openAnalyzer.sendMessage).toEqual(sendMessageMock.object);
    }

    function validateFocusTrackingAnalyzer(openAnalyzer, config): void {
        expect(openAnalyzer.tabStopListenerRunner).toEqual(tabStopsListener.object);
        expect(openAnalyzer.tabStopsDoneAnalyzingTracker).toEqual(
            tabStopsDoneAnalyzingTrackerMock.object,
        );
        expect(openAnalyzer.featureFlagStore).toEqual(featureFlagStoreMock.object);
        expect(openAnalyzer.config).toEqual(config);
        expect(openAnalyzer.sendMessage).toEqual(sendMessageMock.object);
    }
});
