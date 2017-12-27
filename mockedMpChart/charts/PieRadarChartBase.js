import PropTypes from 'prop-types';

import ChartBase from './ChartBase';

const iface = {
    propTypes: {
        ...ChartBase.propTypes,

        minOffset: PropTypes.number,
        rotationEnabled: PropTypes.bool,
        rotationAngle: PropTypes.number
    }
};

export default iface;
