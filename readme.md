
Usage (todo)

```typescript
const actionProcessor = actionProcessorFactory<ACTION_NAMES_TYPE, PLUGIN_NAMES_TYPE, IEventExtended>(pluginSet);
const errorThrower = errorThrowerFactory<ERROR_NAMES_TYPE, IEventExtended>(ERRORS);
const eventFactory = eventExtendedFactoryFactory(errorThrower, OBJECT_INFO, ENTITY_RELATIONS);
const eventAdaptor = eventAdaptorFactory<ACTION_NAMES_TYPE, ERROR_NAMES_TYPE, ENTITY_NAMES, OPTIONS_TYPE, PLUGIN_NAMES_TYPE
  >(allowedActions, allowedOptions, routingChanges, setLangAndUserId);
const contractProvider = contractProviderFactory<ACTION_NAMES_TYPE, ENTITY_NAMES, IEventExtended
  >(TRANSFORM_CONTRACTS, setCompanyId);
const eventProcessor = eventProcessorFactory<ACTION_NAMES_TYPE, ERROR_NAMES_TYPE, ENTITY_NAMES, OPTIONS_TYPE, PLUGIN_NAMES_TYPE, IEventExtended
  >(contractProvider, actionProcessor, eventFactory, eventAdaptor);

const handler = async (req: Request, res: Response) => {
  try {
    const { objectname: objectName, actionname: actionName, actionnametype: actionNameType } = req.params;
    const { preEvent, preAction } = await eventAdaptor.makePreEvent(req.body, objectName, actionName, actionNameType);
    const result = await eventProcessor.processRequest(preEvent, preAction);
    
    if (result.headers) {
      res.set(result.headers);
    }
    return res.status(result.statusCode).send(JSON.parse(lambdaRes.body));
  } catch (e: any) {
    return res.status(500).send(`Action failed, ${e}, ${e?.stack}`);
  }
};

```
