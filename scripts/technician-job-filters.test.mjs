import assert from 'node:assert/strict';
import {filterTechnicianJobs,isoWeek,technicianPeriod,jobRecordTime,recordDateTime} from '../src/utils/technicianJobFilters.js';
import {workerScreens} from '../src/utils/workforceAccess.js';
const jobs=[
 {id:'active',assignedTechId:'t',assignedAt:'2026-11-13T03:30:00Z',workPhase:'Assigned'},
 {id:'paid',assignedTechId:'t',isPaid:true,workPhase:'Done',status:'Delivered',paymentCompletedAt:'2026-11-13T09:00:00Z'},
 {id:'canceled',assignedTechId:'t',status:'Cancelled',cancelledAt:'2026-11-12T09:00:00Z'},
 {id:'older',assignedTechId:'t',status:'Delivered',isPaid:true,workPhase:'Done',paymentCompletedAt:'2026-10-01T09:00:00Z'},
];
assert.equal(isoWeek('2026-11-13'),'2026-W46');assert.equal(isoWeek('2021-01-01'),'2020-W53');
assert.deepEqual(technicianPeriod({period:'Weekly',week:'2026-W46'}),{from:'2026-11-09',to:'2026-11-15',label:'Week 46 · 2026'});
assert.equal(technicianPeriod({period:'Weekly',week:'2021-W53'}).invalid,true);
assert.equal(technicianPeriod({period:'Monthly',month:'2024-02'}).to,'2024-02-29');
assert.equal(technicianPeriod({period:'Yearly',year:'2026'}).to,'2026-12-31');
assert.deepEqual(filterTechnicianJobs(jobs,{period:'Date',date:'2026-11-13'}).map(j=>j.id),['paid','active']);
assert.deepEqual(filterTechnicianJobs(jobs,{period:'All time',status:'Completed'}).map(j=>j.id),['paid','older']);
assert.deepEqual(filterTechnicianJobs(jobs,{period:'Weekly',week:'2026-W46',status:'Cancelled'}).map(j=>j.id),['canceled']);
assert.equal(filterTechnicianJobs(jobs,{period:'Monthly',month:'2026-10'}).length,1);
assert.equal(filterTechnicianJobs(jobs,{period:'Yearly',year:'2026'}).length,4);
assert.equal(filterTechnicianJobs([{...jobs[0],assignedAt:'2026-11-12T20:00:00Z'}],{period:'Date',date:'2026-11-13'}).length,1,'Indian date is used at midnight boundary');
assert.equal(jobRecordTime(jobs[1]),jobs[1].paymentCompletedAt);assert.ok(recordDateTime(jobs[1].paymentCompletedAt).includes('2026'));assert.equal(recordDateTime(''),'Time not recorded');
assert.ok(!workerScreens({role:'technician'}).includes('history'));
console.log('Passed status/date filters, completed records, numbered ISO weeks, year boundaries, leap months, Indian timezone and removed History navigation.');
