import _ from 'lodash';

const extractPermsFromRole = (role) => {
  let perms = role.permissions;
  if(role.roles && role.roles.length) {
    role.roles.forEach((r) => { perms = [...perms, ...extractPermsFromRole(r)]; });
  }
  return perms;
};

const getFlattenedPerms = (user, allPermissions) => {
  let perms = [];
  if(!user.roles) return perms;

  user.roles.forEach((r) => { perms = [...perms, ...extractPermsFromRole(r)]; });
  perms = _.uniq(perms);
  perms = perms.map(permName => allPermissions.find(o => o.name === permName));
  perms = perms.filter(perm => !!perm);
  return perms;
};

// ownership can be 'own' or 'any'
const userCanDo = (user, operation, ownership, type) => {
  const perm = user.permissions.find(p => p.operation === operation && p.ownership === ownership && p.type === type);
  return !!perm || user.hasRole('super-user');
};

const attachUserAuthMethods = (user, allPermissions) => {
  const permissions = getFlattenedPerms(user, allPermissions);
  user.permissions = permissions;

  user.hasPerm = function (perm) { return !!permissions.find(p => p.name === perm); };
  user.hasRole = function (role) { return !!this.roles.find(r => r.name === role); };
  user.canDoOnAny = function (operation, type) { return userCanDo(this, operation, 'any', type); };
  user.canDoOnOwn = function (operation, type) { return userCanDo(this, operation, 'own', type); };

  user.isOwner = function (docs, type) {
    if(!docs) return true;
    if(!Array.isArray(docs)) docs = [docs];

    let isOwner = true;

    docs.forEach((doc) => {
      if(type === 'User') {
        // Special case for User because owner is doc id
        if(doc.id !== this.id) isOwner = false;
      }
      if(!doc.user) isOwner = false;
      if(doc.user.id !== this.id) isOwner = false;
    });

    return isOwner;
  };

  user.canDo = function (operation, type, docs) {
    return (
      this.canDoOnAny(operation, type) // allow if user can do this operation on any doc of this type
      || (this.isOwner(docs, type) && this.canDoOnOwn(type, operation)) // allow if user can do operation on own docs of this type
    );
  };
};

export default attachUserAuthMethods;
