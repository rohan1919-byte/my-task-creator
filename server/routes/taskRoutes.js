const r=require('express').Router();const c=require('../controllers/taskController');
r.get('/statistics',c.stats);r.route('/').get(c.list).post(c.create);
r.route('/:id').get(c.get).put(c.update).delete(c.remove);
r.patch('/:id/complete',c.complete);r.patch('/:id/reopen',c.reopen);module.exports=r;
