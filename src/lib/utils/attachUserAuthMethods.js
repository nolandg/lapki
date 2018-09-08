import _ from 'lodash';

const pascalCaseToUnderscores = string => string.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`).replace(/^_/g, '');

const extractPermsFromRole = (role) => {
  let perms = role.permissions;
  if(role.roles && role.roles.length) {
    role.roles.forEach((r) => { perms = [...perms, ...extractPermsFromRole(r)]; });
  }
  return perms;
};

const getFlattenedPerms = (user) => {
  let perms = [];
  if(!user.roles) return perms;
  
  user.roles.forEach((r) => { perms = [...perms, ...extractPermsFromRole(r)]; });
  perms = _.uniqBy(perms, 'id');
  return perms;
};

// ownership can be 'own' or 'any'
const userCanDo = (user, operation, ownership = 'own', type) => {
  type = pascalCaseToUnderscores(type);
  const perm = operation !== 'create'
    ? `${operation}-${ownership}-${type}`
    : `${operation}-${type}`;
  return user.hasPerm(perm) || user.hasRole('super-user');
};

const attachUserAuthMethods = (user) => {
  const permissions = getFlattenedPerms(user);

  user.hasPerm = function (perm) { return !!permissions.find(p => p.name === perm); };
  user.hasRole = function (role) { return !!this.roles.find(r => r.name === role); };
  user.canDoOnAny = function (operation, type) { return userCanDo(this, operation, 'any', type); };
  user.canDoOnOwn = function (operation, type) { return userCanDo(this, operation, 'own', type); };

  user.isOwner = function (docs, type) {
    if(!docs || !docs.length) return true;
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
    // allow passing of string or Collection object
    if(typeof type === 'object') type = type.type;

    return (
      this.canDoOnAny(operation, type) // allow if user can do this operation on any doc of this type
      || (this.isOwner(docs, type) && this.canDoOnOwn(type, operation)) // allow if user can do operation on own docs of this type
    );
  };
};

export default attachUserAuthMethods;
