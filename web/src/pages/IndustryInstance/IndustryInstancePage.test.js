import React from 'react';
import ReactDOM from 'react-dom';
import IndustryInstancePage from './IndustryInstancePage';

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<IndustryInstancePage />, div);
    ReactDOM.unmountComponentAtNode(div);
});

it('CheckboxWithLabel changes the text after click', () => {
    // Render a checkbox with label in the document
    const checkbox = shallow(<CheckboxWithLabel labelOn="On" labelOff="Off" />);

    expect(checkbox.text()).toEqual('Off');

    checkbox.find('input').simulate('change');

    expect(checkbox.text()).toEqual('On');
});
