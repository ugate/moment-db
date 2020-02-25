'use strict';

import MomentDB from '../index.js';
import jest from 'jest';
jest.mock('../index.js');

const PLAN = MomentDB.constructor.name;

jest.test(`${PLAN}: `, () => {
  const date = new Date(Date.UTC(2030, 0, 1));
  jest.expect(MomentDB.toDate(date)).toBe('2030-01-01');
});