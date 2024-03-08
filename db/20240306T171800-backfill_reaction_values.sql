insert into reactions (
  emoji,
  message_id,
  user_id
)
select emoji,
message_id,
user_id
from reaction;
