import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import { Bar } from 'react-chartjs-2';
import { Button, Collapse, Container, Row, Jumbotron, Col, Nav, Card } from 'reactstrap';
import BootstrapTable from 'react-bootstrap-table-next';
import { fetchInstanceData, fetchJoinedInstanceData } from '../../fetchAPI';
import './occupation-instance-page.css';
import { isMajorModel } from '../../constants';
import { DetailedInstanceList, TopTenWidget, WageSalaryTable, InstanceInfo } from '../../components';

mapboxgl.accessToken =
    'pk.eyJ1IjoiYW1ldGh5c3QtZWU0NjFsIiwiYSI6ImNqdDdxYWxzZzAwcXc0NG91NnJ4Z2t4bnMifQ.1M-jA2MKBuUbXoy3bIMxlw';

// Finding the maximum loc_quotient value for this locationData set
function getMaxLocQuotient(locationData) {
    let maxLocQuotient = 0;
    console.log('locationData array quotient calculation', locationData);
    locationData.forEach(stateData => {
        if (stateData.loc_quotient > maxLocQuotient) {
            maxLocQuotient = stateData.loc_quotient;
        }
    });
    return maxLocQuotient;
}

function createHeatMapping(locationData) {
    // For use to calculate state fill shade color
    const expression = ['match', ['get', 'STATE_ID']];

    // Maximum location quotient
    const maxLocQuotient = getMaxLocQuotient(locationData);
    // Calculate color
    locationData.forEach(stateData => {
        if (stateData.loc_quotient === -1.0) {
            // grey color if no location quotient for state
            const color = `rgba(${102}, ${102}, ${121}, 0.75)`;
            expression.push(stateData.states.id, color);
        } else {
            const green = 255 - (stateData.loc_quotient / maxLocQuotient) * 255;
            const color = `rgba(${255}, ${green}, ${132}, 0.75)`;
            expression.push(stateData.states.id, color);
        }
    });
    // Last value is the default
    expression.push('rgba(0,0,0,0)');

    return expression;
}
let map;

class OccupationInstancePage extends Component {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
        this.state = {
            occupationData: null,
            industryData: null,
            locationData: null,
            mapLoaded: false,
            isDataLoaded: false,
            collapse: false
        };
    }

    componentDidMount() {
        const { tablename, id } = this.props.match.params;
        this.fetchData(tablename, id);
        map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/mapbox/light-v10',
            center: [-96, 40],
            zoom: 2.25
        });

        map.on('load', () => {
            map.addSource('states', {
                type: 'vector',
                url: 'mapbox://mapbox.us_census_states_2015'
            });
            const expression = ['match', ['get', 'STATE_ID']];
            expression.push('rgba(0,0,0,0)');
            expression.push('rgba(0,0,0,0)');
            expression.push('rgba(0,0,0,0)');

            // Add layer from the vector tile source with data-driven style
            map.addLayer(
                {
                    id: 'heat-layer',
                    type: 'fill',
                    source: 'states',
                    'source-layer': 'states',
                    paint: {
                        'fill-color': expression,
                        'fill-opacity': 0,
                        'fill-opacity-transition': { duration: 500 }
                    },
                    transition: {
                        duration: 2000,
                        delay: 0
                    }
                },
                'waterway-label'
            );
            const popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false
            });

            // map.on('mousemove', function(e) {
            //     map.getCanvas().style.cursor = 'pointer';
            //     const position = {
            //         lon: e.lngLat.lng,
            //         lat: e.lngLat.lat
            //     };
            //     const mappopup = map.queryRenderedFeatures(e.point, {
            //         layers: ['heat-layer']
            //     });
            //     // if()
            //     popup
            //         .setLngLat(position)
            //         .setHTML(mappopup[0].properties.STATE_NAME)
            //         .addTo(map);
            //     console.log('popup data', mappopup);
            // });
            // map.on('mouseleave', function() {
            //     map.getCanvas().style.cursor = '';
            //     popup.remove();
            // });
            this.setState({ mapLoaded: true });
        });
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (
            nextProps.match.params.tablename !== this.props.match.params.tablename ||
            nextProps.match.params.id !== this.props.match.params.id
        ) {
            this.setState({ isDataLoaded: false });
            console.log('shouldComponentUpdate false fetch', nextProps.match.params.tablename);
            const { tablename, id } = nextProps.match.params;
            this.fetchData(tablename, id);
            return false;
        }
        if (nextState.isDataLoaded && nextState.mapLoaded) {
            console.log('shouldComponentUpdate true', nextProps, nextState);
            return true;
        }
        console.log('shouldComponentUpdate false', nextState);
        return false;
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.mapLoaded && this.state.isDataLoaded) {
            this.setHeatMapping();
        }
    }

    setHeatMapping = () => {
        const { mapLoaded, locationData } = this.state;
        console.log('setHeatMapping', mapLoaded, locationData);

        if (mapLoaded && locationData) {
            const expression = createHeatMapping(locationData);
            map.setPaintProperty('heat-layer', 'fill-opacity', 0);

            setTimeout(function() {
                console.log('setTimeout', map);
                map.setPaintProperty('heat-layer', 'fill-opacity', 1);
            }, 1000);

            setTimeout(function() {
                console.log('setTimeout', map);
                map.setPaintProperty('heat-layer', 'fill-color', expression);
            }, 1000);
        }
    };

    fetchData = async (tablename, id) => {
        // const { tablename, id } = this.props.match.params;
        console.log('fetchData', tablename, id);
        const occupationData = await fetchInstanceData(tablename, id);
        // const industryData = await fetchJoinedInstanceData(tablename, 'industries_3d', id);
        const locationData = await fetchJoinedInstanceData(tablename, 'states', id);

        this.setState({
            occupationData,
            // industryData,
            locationData,
            isDataLoaded: true
        });
    };

    // Handles toggle button for collapsible detailed occupations list
    toggle() {
        this.setState(state => ({ collapse: !state.collapse }));
    }

    renderOccupation = () => {
        const { tablename } = this.props.match.params;
        const { occupationData } = this.state;
        if (occupationData) {
            return (
                <Jumbotron>
                    <h1 className="display-3">{occupationData.title}</h1>
                    <p>Occupation Code: {occupationData.id}</p>
                    {isMajorModel[tablename] ? null : (
                        <div>
                            <hr className="my-2" />
                            <p className="lead">Description: {occupationData.description}</p>
                        </div>
                    )}
                </Jumbotron>
            );
        }
    };

    renderOccupationData = () => {
        const { occupationData } = this.state;
        if (occupationData) {
            const tableData = {
                title: occupationData.title,
                total_employment: occupationData.total_employment,
                columns: [
                    {
                        dataField: 'type',
                        text: 'Type'
                    },
                    {
                        dataField: 'mean',
                        text: 'Mean'
                    },
                    {
                        dataField: 'median',
                        text: 'Median'
                    },
                    {
                        dataField: '10',
                        text: '10th Percentile'
                    },
                    {
                        dataField: '25',
                        text: '25th Percentile'
                    },
                    {
                        dataField: '75',
                        text: '75th Percentile'
                    },
                    {
                        dataField: '90',
                        text: '90th Percentile'
                    }
                ],
                rows: [
                    {
                        type: 'Annual Salary',
                        mean: occupationData.annual_mean,
                        median: occupationData.annual_median,
                        '10': occupationData.annual_10,
                        '25': occupationData.annual_25,
                        '75': occupationData.annual_75,
                        '90': occupationData.annual_90
                    },
                    {
                        type: 'Hourly Wage',
                        mean: occupationData.hourly_mean,
                        median: occupationData.hourly_median,
                        '10': occupationData.hourly_10,
                        '25': occupationData.hourly_25,
                        '75': occupationData.hourly_75,
                        '90': occupationData.hourly_90
                    }
                ]
            };
            return (
                <Row style={{ paddingLeft: '1em', paddingRight: '1em' }}>
                    <h5 style={{ margin: 'auto' }}>Salary and Wage Statistics</h5>
                    <BootstrapTable hover keyField="type" data={tableData.rows} columns={tableData.columns} />
                </Row>
            );
        }
    };

    renderLocationData = () => {
        const { mapLoaded, occupationData, locationData } = this.state;
        if (mapLoaded && occupationData && locationData) {
            return (
                <div>
                    <h1>Where are {occupationData.title} located?</h1>
                </div>
            );
        }
    };

    renderGraphs = () => {
        const { tablename, id } = this.props.match.params;

        const { occupationData } = this.state;

        if (occupationData) {
            return (
                <div style={{ margin: 'auto' }}>
                    <TopTenWidget
                        joined
                        title="Top 10 Industries by"
                        primaryTable={tablename}
                        secondaryTable="industries_3d"
                        id={id}
                        total_employment={occupationData.total_employment}
                    />

                    <TopTenWidget
                        joined
                        title="Top 10 States by"
                        // population
                        primaryTable={tablename}
                        secondaryTable="states"
                        id={id}
                        total_employment={occupationData.total_employment}
                        // total_population={occupationData.total_population}
                    />
                </div>
            );
        }
    };

    renderDetailedInstanceList = () => {
        const { tablename } = this.props.match.params;
        const { occupationData } = this.state;

        if (occupationData) {
            return <DetailedInstanceList majorModel={tablename} data={occupationData.occupations_detailed} />;
        }
    };

    render() {
        console.log('render');
        const { tablename, id } = this.props.match.params;
        const { occupationData, locationData, collapse } = this.state;

        const renderLegend = (stop, i) => (
            <div key={i} className="txt-s">
                <span
                    className="mr6 round-full w12 h12 inline-block align-middle"
                    style={{ backgroundColor: stop[1] }}
                />
                <span>{`${stop[0].toLocaleString()}`}</span>
            </div>
        );
        return (
            <Container>
                <Row>
                    <Button color="primary" onClick={this.toggle} style={{ marginBottom: '1rem' }}>
                        Show Detailed Occupations List
                    </Button>
                    <Collapse isOpen={collapse}>
                        <div>{isMajorModel[tablename] ? this.renderDetailedInstanceList() : null}</div>
                    </Collapse>
                    <Col>
                        <Row>
                            {occupationData ? (
                                <InstanceInfo
                                    title={occupationData.title}
                                    idLabel="Occupation Code"
                                    id={occupationData.id}
                                />
                            ) : null}
                        </Row>
                        <br />
                        <Card className="container wage-data">
                            <br />
                            <Row className="align-items-md-center">{this.renderOccupationData()}</Row>
                            <br />

                            <Row style={{ paddingLeft: '1em', paddingRight: '1em' }}>{this.renderGraphs()}</Row>
                            <Row>{occupationData ? <h1>Where are {occupationData.title} located?</h1> : null}</Row>
                            <div ref={el => (this.mapContainer = el)} />
                            <Row>
                                <br />
                                <br />
                                <br />
                                <br />
                                <br />
                                <br />
                                <br />
                                <br />
                                <br />
                                <br />
                                <br />
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </Container>
        );
    }
}

export default OccupationInstancePage;
