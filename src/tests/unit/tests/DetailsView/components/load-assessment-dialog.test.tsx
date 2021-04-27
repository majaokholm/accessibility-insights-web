// // Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.
// import { UrlParser } from 'common/url-parser';
// import { DetailsViewActionMessageCreator } from 'DetailsView/actions/details-view-action-message-creator';
// import {
//     LoadAssessmentDialog,
//     LoadAssessmentDialogDeps,
//     LoadAssessmentDialogProps,
// } from 'DetailsView/components/load-assessment-dialog';
// import { shallow } from 'enzyme';
// import * as React from 'react';
// import { It, Mock, MockBehavior, Times } from 'typemoq';

// describe('LoadAssessmentDialog', () => {
//     const detailsViewActionMessageCreatorMock = Mock.ofType(DetailsViewActionMessageCreator);
//     const urlParserMock = Mock.ofType(UrlParser, MockBehavior.Strict);

//     const deps = {
//         detailsViewActionMessageCreator: detailsViewActionMessageCreatorMock.object,
//     } as LoadAssessmentDialogDeps;
//     const props = { deps } as LoadAssessmentDialogProps;

//     it('should render properly', () => {
//         const rendered = shallow(<LoadAssessmentDialog {...props} />);

//         expect(rendered.getElement()).toMatchSnapshot();
//     });

//     it('should render null when prevTab does not exists', () => {
//         prevTab => {
//             const detailsViewActionMessageCreatorMock = Mock.ofType(
//                 DetailsViewActionMessageCreator,
//             );

//             const newTab = {
//                 id: 111,
//                 url: 'https://www.def.com',
//                 title: 'test title',
//             };

//             urlParserMock
//                 .setup(urlParserObject => urlParserObject.areURLsEqual(It.isAny(), newTab.url))
//                 .returns(() => true)
//                 .verifiable(Times.never());

//             // const loadAssessmentDialogProps: LoadAssessmentDialogProps = {
//             //     deps: {
//             //         urlParser: urlParserMock.object,
//             //         detailsViewActionMessageCreator: detailsViewActionMessageCreatorMock.object,
//             //     },
//             //     prevTab: prevTab,
//             //     newTab: newTab,
//             // };

//             //const wrapper = shallow(<LoadAssessmentDialog {...loadAssessmentDialogProps} />);

//             // expect(wrapper.find(Dialog).exists()).toBe(false);
//             // urlParserMock.verifyAll();
//         }
// });


// });
