import React, { Component } from 'react';
import { fetchInstanceData } from '../../../fetchAPI';

class IndustryPage extends Component {
    state = {
        instanceData: null
    };

    componentDidMount() {
        const { tablename, id } = this.props.match.params;
        console.log('constructor', tablename, id);

        fetchInstanceData(tablename, id).then(instanceData => {
            this.setState({ instanceData });
            console.log('constructor', instanceData);
        });
    }

    render() {
        return <div>this is the industry main page</div>;
    }
}

export default IndustryPage;
