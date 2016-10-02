// @flow
import 'babel-polyfill';
import chai from 'chai';
import sinonChai from 'sinon-chai';

chai.config.truncateThreshold = 0; 
chai.use(sinonChai);
