import {db} from './_db.js';import {MISSIONS,periodKey} from './_rewards-policy.js';
export async function applyVerifiedMissions(result,room,members){if(!result?.id||result.status!=='completed')return;const now=new Date(result.completed_at||Date.now()),metrics=room.state?.meta?.rewardMetrics||{},winner=result.winner_id;
 for(const m of members){const base={matches:1,wins:m.user_id===winner?1:0,ludoFinishes:Number(metrics[m.color]?.ludoFinishes||0),cardActions:Number(metrics[m.color]?.cardActions||0)};
  for(const def of MISSIONS){const delta=base[def.metric]||0;if(!delta)continue;const pk=periodKey(def.period,now),key=['result',result.id,m.user_id,def.key].join(':');await db('rpc/apply_mission_progress',{method:'POST',body:{p_user:m.user_id,p_mission:def.key,p_period:pk,p_delta:delta,p_event_key:key}})}
 }}
