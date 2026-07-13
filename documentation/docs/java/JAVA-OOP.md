---
title: Java OOP Learning Guide
sidebar_position: 1
description: A concise route through Java object design, relationships, polymorphism, contracts, and language mechanics.
---

# Java Object-Oriented Programming

<DocLabels items={[
  {label: 'Foundation', tone: 'foundation'},
  {label: 'Design review', tone: 'intermediate'},
  {label: 'Shopverse examples', tone: 'shopverse'},
]} />

Object-oriented design assigns state and behavior to collaborators with clear
responsibilities. The goal is not a large class hierarchy; it is a model whose
invariants, ownership, and extension points remain understandable as Shopverse
changes.

## The Design Map

```mermaid
flowchart LR
  invariant["Protect domain invariants"] --> object["Cohesive object"]
  object --> ownership["Choose ownership and lifecycle"]
  ownership --> contract["Expose a focused contract"]
  contract --> variants["Substitute domain behaviors"]
  variants --> verify["Preserve equality and subtype contracts"]
```

| Question | OOP idea | Shopverse example |
|---|---|---|
| Who may change this state? | encapsulation | `Order` changes status through named transitions |
| Who owns this object's lifecycle? | composition | an order creates and owns its order lines |
| Can every subtype honor the same promises? | inheritance and LSP | every `PaymentProvider` must return the provider-neutral result contract |
| Can behavior vary without changing the caller? | polymorphism | payment processing calls the configured provider through one port |
| When are two values logically the same? | object contracts | an immutable order number can use value equality; a persisted entity needs a deliberate identity policy |

## Learning Route

<TopicCards items={[
  {title: 'Composition and inheritance', href: '/java/oop/OOP-COMPOSITION-INHERITANCE', description: 'Model association, ownership, lifecycle, and truthful subtype relationships.', icon: 'layers', tags: ['Ownership', 'LSP']},
  {title: 'Polymorphism and contracts', href: '/java/oop/OOP-DOMAIN-POLYMORPHISM-OBJECT-CONTRACTS', description: 'Apply ports and strategies while preserving equality and identity rules.', icon: 'boxes', tags: ['Domain design', 'Equality']},
  {title: 'Abstraction and interfaces', href: '/java/JAVA-ABSTRACTION-INTERFACES', description: 'Choose Java abstraction tools and resolve interface method conflicts.', icon: 'code', tags: ['Interfaces', 'Functional Java']},
  {title: 'Overloading resolution', href: '/java/JAVA-OVERLOADING-RESOLUTION-DEEP-DIVE', description: 'Predict compile-time method selection across conversions and varargs.', icon: 'route', tags: ['Compiler', 'Interview depth']},
  {title: 'Overriding and hiding', href: '/java/JAVA-OVERRIDING-HIDING-DEEP-DIVE', description: 'Separate runtime dispatch from static method and field resolution.', icon: 'brain', tags: ['Dispatch', 'Tricky cases']},
  {title: 'Language and OOP internals', href: '/java/JAVA-LANGUAGE-OOP-INTERNALS', description: 'Explore construction, bridge methods, dispatch, and compatibility mechanics.', icon: 'experiment', tags: ['JVM', 'Internals']},
]} />

## Four Principles In One Review

| Principle | Review test | Warning sign |
|---|---|---|
| encapsulation | can invalid state be created without using domain behavior? | public mutation or a setter for every field |
| abstraction | does a caller see only the capability it needs? | provider or persistence details leak into domain code |
| inheritance | is the subtype substitutable for the base contract? | inheritance exists only to reuse implementation |
| polymorphism | can a new valid behavior be added behind the same contract? | caller branches on concrete implementation type |

These principles reinforce one another. A focused abstraction enables
polymorphism; composition supplies that abstraction to a cohesive object;
encapsulation keeps the resulting collaboration valid.

<DocCallout type="mistake" title="Inheritance is a behavioral promise">
A subtype must preserve the base type's valid inputs, outputs, failures, and
side-effect expectations. Reusing a few methods is not enough to justify an
inheritance relationship.
</DocCallout>

## Shopverse Review Checklist

- Put state transitions such as `confirm`, `cancel`, and `refund` beside the
  state they protect.
- State whether each relationship means temporary use, shared membership, or
  lifecycle ownership.
- Prefer focused ports at service boundaries and keep provider DTOs behind
  adapters.
- Require every implementation to preserve success, failure, validation, and
  side-effect expectations.
- Make value objects immutable and define entity equality deliberately.
- Keep class hierarchies shallow; use sealed types when the domain truly has a
  closed set of alternatives.

## Official References

- [JLS classes](https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html)
- [JLS interfaces](https://docs.oracle.com/javase/specs/jls/se25/html/jls-9.html)
- [`Object` API contracts](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Object.html)
